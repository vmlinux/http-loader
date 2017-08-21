'use strict'

var httpLoader = (function() {

    ScriptContext.prototype = {

        getContent: function() {

            return this.elt.textContent;
        },

        setContent: function(content) {

            this.elt.textContent = content;
        },

        compile: function(module) {

            var childModuleRequire = function(childUrl) {

                return httpLoader.require((childUrl.substr(0,2) === './' || childUrl.substr(0,3) === '../' ? this.component.baseURI : '') + childUrl);
            }.bind(this);

            try {
                Function('exports', 'require', 'module', this.getContent()).call(this.module.exports, this.module.exports, childModuleRequire, this.module);
            } catch(ex) {

                if ( !('lineNumber' in ex) ) {

                    return Promise.reject(ex)
                }
                var jsFileData = responseText.replace(/\r?\n/g, '\n');
                var lineNumber = jsFileData.substr(0, jsFileData.indexOf(script)).split('\n').length + ex.lineNumber - 1;
                throw new (ex.constructor)(ex.message, url, lineNumber);
            }

            return Promise.resolve(this.module.exports)
        }
    }

    function ScriptContext(component, elt) {

        this.component = component;
        this.elt = elt;
        this.module = { exports:{} };
    }

    httpLoader.require = function(moduleName) {

        return window[moduleName];
    }

    httpLoader.httpRequest = function(url) {

        return new Promise(function(resolve, reject) {

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);

            xhr.onreadystatechange = function() {

                if ( xhr.readyState === 4 ) {

                    if ( xhr.status >= 200 && xhr.status < 300 )
                        resolve(xhr.responseText);
                    else
                        reject({status: xhr.status, url: xhr.responseURL});
                }
            }

            xhr.send(null);
        });
    }

    Component.prototype = {

        getHead: function() {

            return document.head || document.getElementsByTagName('head')[0];
        },

        load: function(componentUrl) {

            return httpLoader.httpRequest(componentUrl)
            .then(function(responseText) {

                this.baseURI = componentUrl.substr(0, componentUrl.lastIndexOf('/')+1);
                var doc = document.implementation.createHTMLDocument('');

                // IE requires the <base> to come with <style>
                doc.body.innerHTML = (this.baseURI ? '<base href="'+this.baseURI+'">' : '') + "<script>" + responseText + "</script>";

                for ( var it = doc.body.firstChild; it; it = it.nextSibling ) {

                    switch ( it.nodeName ) {
                        case 'SCRIPT':
                            this.script = new ScriptContext(this, it);
                            break;
                    }
                }

                return this;
            }.bind(this));
        },

        compile: function() {

            return Promise.all(Array.prototype.concat(
                this.script && this.script.compile())
            )
            .then(function() {

                return this;
            }.bind(this));
        }
    }

    function Component(name) {

        this.name = name;
        this.script = null;
    }

    httpLoader.load = function(url, name) {

        return function() {

            return new Component(name || url.substr(url.lastIndexOf('/')+1).replace(/\./,'_'))
            .load(url)
            .then(function(component) {

                return component.compile();
            })
            .then(function(component) {

                var exports = component.script !== null ? component.script.module.exports : {};

                if ( exports.name === undefined )
                    if ( component.name !== undefined )
                        exports.name = component.name;

                return exports;
            })
        }();
    }

    function parseComponentURL(url) {

        var comp = url.match(/(.*?)([^/]+?)\/?(\.js)?(?:\?|#|$)/);
        return {
            name: comp[2],
            url: comp[1] + comp[2] + (comp[3] === undefined ? '/index.js' : comp[3])
        }
    }

    function httpLoader(url, name) {
        var comp = parseComponentURL(url);
        return httpLoader.load(comp.url, name);
    }

    return httpLoader;
})();