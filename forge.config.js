module.exports = {
    packagerConfig: {
        name: 'Galileo',
        appBundleId: 'com.christophe.galileo',
        ignore: [/[/\\]sidecar\.db$/]
    },
    makers: [
        {
            name: '@electron-forge/maker-dmg',
            config: {}
        }
    ]
}