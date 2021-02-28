import * as Webhooks from '..'
import http from 'http'

// ************************************************************
// THIS CODE IS NOT EXECUTED. IT IS JUST FOR TYPECHECKING
// ************************************************************


export default async function() {
    // Check empty constructor
    new Webhooks()

    // Check that all options are optional except for secret
    new Webhooks({
        secret: 'bleh'
    })

    // Check all supported options
    const webhooks = new Webhooks({
        secret: 'bleh',
        path: '/webhooks',
        transform: (event) => event
    })

    webhooks.on('*', ({id, name, payload}) => {
        console.log(name, 'event received')
        const sig = webhooks.sign(payload)
        webhooks.verify(payload, sig)
    })

    http.createServer(webhooks.middleware).listen(3000)
}
