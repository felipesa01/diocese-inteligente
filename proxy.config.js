const proxy = [
  {
    context: '/APIFramework/token',
    target: 'https://intranet-dsv.santanadeparnaiba.sp.gov.br/SisGeo-API/',
    secure: false,
    logLevel: "debug",
    changeOrigin: true,
    headers: {
      Connection: 'keep-alive'
    }
  }
];

module.exports = proxy;