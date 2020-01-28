const { Router } = require('express');

const routes = new Router();

routes.get('/', (req,res) => {
    return res.send('teste')
})

module.exports = routes;