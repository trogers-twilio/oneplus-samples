exports.handler = function (context, event, callback) {
  const { countryCode } = event;
  console.log('Received request for countryCode', countryCode);

  const countryCodeLanguages = {
    AU: 'en-AU',
    BR: 'pt-BR',
    CA: 'en-CA',
    CN: 'zh-CN',
    DE: 'de-DE',
    DK: 'da-DK',
    ES: 'ca-ES',
    FI: 'fi-FI',
    FR: 'fr-FR',
    GB: 'en-GB',
    HK: 'zh-HK', 
    IN: 'en-IN',
    IT: 'it-IT',
    JP: 'ja-JP',
    KR: 'ko-KR',
    MX: 'es-MX',
    NL: 'nl-NL',
    NO: 'nb-NO',
    PL: 'pl-PL',
    PT: 'pt-PT',
    RU: 'ru-RU',
    SE: 'sv-SE',
    TW: 'zh-TW',
    US: 'en-US',
  };

  const language = countryCodeLanguages[countryCode];
  if (!language) {
    console.log('Unsupported country code');
    const message = `Country code must be one of the following: ${Object.keys(countryCodeLanguages).join(', ')}`;
    return callback(message, null);
  }

  const response = {
    language
  };
  return callback(null, response);
};