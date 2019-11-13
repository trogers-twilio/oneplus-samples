exports.handler = function (context, event, callback) {
  const { language } = event;
  console.log('Received request for language', language);

  const greetings = {
    en: 'Hello. Please wait one moment while I find someone to help you.',
    zh: '你好. 我找人帮助您, 请稍候.',
    es: 'Hola. Por favor espera un momento mientras encuentro a alguien que te ayude.',
    fr: `Salut. S'il vous plaît attendez un instant pendant que je trouve quelqu'un pour vous aider.`,
    it: 'Ciao. Per favore, aspetta un momento mentre trovo qualcuno che ti aiuti.',
  }

  const languageCodeGreetings = {
    'en-AU': greetings.en,
    'en-CA': greetings.en,
    'en-GB': greetings.en,
    'en-IN': greetings.en,
    'en-US': greetings.en,
    'zh-CN': greetings.zh,
    'ca-ES': greetings.es,
    'fr-FR': greetings.fr,
    'it-IT': greetings.it,
  };

  const greeting = languageCodeGreetings[language];
  if (!greeting) {
    console.log('Unsupported language');
    const message = `Language must be one of the following: ${Object.keys(languageCodeGreetings).join(', ')}`;
    return callback(message, null);
  }

  const response = {
    message: greeting
  };
  return callback(null, response);
};