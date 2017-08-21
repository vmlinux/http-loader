Promise.all([
    httpLoader('store/bar'),
    httpLoader('store/foo')
]).then((m) => {
    return new Vuex.Store({
        modules: m
    })
}).then((store) => {
    const router = new VueRouter({
        routes: [
            {path: '/', name: 'foo', component: httpVueLoader('pages/foo')},
            {path: '/bar', name: 'bar', component: httpVueLoader('pages/bar')}
        ]
    })
    new Vue({
        el: '#app',
        router,
        store,
        template: '<div><ul><li><router-link to="/">foo</router-link></li><li><router-link to="bar">bar</router-link></li></ul><router-view></router-view></div>'
    })
})