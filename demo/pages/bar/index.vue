<template>
    <div>
        <h1>My name is {{ myName }}</h1>
    </div>
</template>

<script>
module.exports = {
    computed: {
        myName () {
            return this.$store.getters.barName
        }
    }
}
</script>
