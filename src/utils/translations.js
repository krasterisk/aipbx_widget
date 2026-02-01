/**
 * Simple translation utility for the widget
 */

const translations = {
    en: {
        ready_to_talk: 'Ready to talk',
        click_to_begin: 'Click start to begin conversation',
        connecting: 'Connecting...',
        listening: 'Listening...',
        ai_ready: 'AI is ready to help you',
        start_conversation: 'Start Conversation',
        stop_call: 'Stop Call',
        error_occurred: 'An error occurred. Please try again.',
        microphone_error: 'Microphone access denied or not available.',
        network_error: 'Network error. Please check your connection.',
        session_ended: 'Session ended'
    },
    ru: {
        ready_to_talk: 'Готов к общению',
        click_to_begin: 'Нажмите «Старт», чтобы начать разговор',
        connecting: 'Подключение...',
        listening: 'Слушаю...',
        ai_ready: 'ИИ готов помочь вам',
        start_conversation: 'Начать разговор',
        stop_call: 'Завершить',
        error_occurred: 'Произошла ошибка. Попробуйте еще раз.',
        microphone_error: 'Доступ к микрофону запрещен или недоступен.',
        network_error: 'Ошибка сети. Проверьте соединение.',
        session_ended: 'Разговор завершен'
    },
    de: {
        ready_to_talk: 'Bereit zum Sprechen',
        click_to_begin: 'Klicken Sie auf Start, um das Gespräch zu beginnen',
        connecting: 'Verbindung wird hergestellt...',
        listening: 'Hören...',
        ai_ready: 'KI ist bereit, Ihnen zu helfen',
        start_conversation: 'Gespräch beginnen',
        stop_call: 'Beenden',
        error_occurred: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
        microphone_error: 'Mikrofonzugriff verweigert oder nicht verfügbar.',
        network_error: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
        session_ended: 'Sitzung beendet'
    },
    zh: {
        ready_to_talk: '准备通话',
        click_to_begin: '点击开始进行对话',
        connecting: '连接中...',
        listening: '在听...',
        ai_ready: 'AI 已准备好为您提供帮助',
        start_conversation: '开始对话',
        stop_call: '结束通话',
        error_occurred: '发生错误。请再试一次。',
        microphone_error: '麦克风访问被拒绝或不可用。',
        network_error: '网络错误。请检查您的连接。',
        session_ended: '通话结束'
    }
};

export class Translator {
    constructor(lang) {
        this.lang = this.determineLanguage(lang);
    }

    determineLanguage(lang) {
        if (lang && translations[lang.toLowerCase()]) {
            return lang.toLowerCase();
        }

        // Auto-detect browser language
        const browserLang = navigator.language.split('-')[0].toLowerCase();
        return translations[browserLang] ? browserLang : 'en';
    }

    t(key) {
        const langData = translations[this.lang] || translations['en'];
        return langData[key] || key;
    }

    getLang() {
        return this.lang;
    }
}
