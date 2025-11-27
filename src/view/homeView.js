import dxui from '../../dxmodules/dxUi.js';
import std from '../../dxmodules/dxStd.js';
import screen from '../screen.js';
import utils from '../common/utils/utils.js';
import config from '../../dxmodules/dxConfig.js';
import passwordView from './passwordView.js';

const homeView = {};

// Definicija boja iz smjernica
const COLORS = {
    BACKGROUND: 0xF2F2F7,
    PRIMARY_TEXT: 0x333333, // Ažurirano prema smjernicama
    SECONDARY_TEXT: 0x8E8E93,
    ACCENT: 0xFF9F0A,
    WHITE: 0xFFFFFF
};

/**
 * Pomoćna funkcija za brisanje osnovnih stilova, po uzoru na mainView.js
 */
function clearStyle(obj) {
    obj.radius(0);
    obj.padAll(0);
    obj.borderWidth(0);
}

/**
 * Pomoćna funkcija za kreiranje labela, po uzoru na mainView.js
 */
function buildLabel(id, parent, size, text, color, fontStyle = dxui.Utils.FONT_STYLE.NORMAL) {
    const label = dxui.Label.build(id, parent);
    const font = dxui.Font.build(screen.fontPath, size, fontStyle);
    label.textFont(font);
    label.textColor(color);
    label.text(text);
    label.textAlign(dxui.Utils.TEXT_ALIGN.LEFT);
    return label;
}

/**
 * Pomoćna funkcija za kreiranje interaktivnih kartica.
 * Koristi samo funkcije koje postoje u mainView.js.
 */
function buildCard(id, parent, imageName, title) {
    // 1. Kreiramo vanjski kontejner koji će služiti kao okvir
    const cardFrame = dxui.View.build(id + '_frame', parent);
    clearStyle(cardFrame);
    cardFrame.setSize(142, 112); // Povećano za 10px
    cardFrame.radius(15);
    cardFrame.bgColor(COLORS.ACCENT); // Boja okvira

    // 2. Kreiramo stvarnu karticu unutar okvira
    const card = dxui.Button.build(id, cardFrame);
    clearStyle(card);
    card.setSize(140, 110); // Povećano za 10px
    card.radius(15); // Zaobljeni rubovi
    card.bgColor(COLORS.WHITE);
    card.bgOpa(200); // Prozirnost za "frosted" efekt
    card.align(dxui.Utils.ALIGN.CENTER, 0, 0); // Centriramo karticu unutar okvira
    
    card.flexFlow(dxui.Utils.FLEX_FLOW.COLUMN);
    card.flexAlign(dxui.Utils.FLEX_ALIGN.SPACE_EVENLY, dxui.Utils.FLEX_ALIGN.CENTER, dxui.Utils.FLEX_ALIGN.CENTER);
    card.obj.lvObjSetStylePadAll(10, 0); // Povećan unutrašnji padding za bolji izgled

    // Ikona (koristimo slike koje ste dodali)
    const iconImage = dxui.Image.build(id + '_icon', card);
    iconImage.source('/app/code/resource/image/' + imageName);
    
    // Naslov
    const titleLabel = buildLabel(id + '_title', card, 16, title, COLORS.PRIMARY_TEXT, dxui.Utils.FONT_STYLE.BOLD);

    return card; // Vraćamo unutrašnju karticu (dugme) radi eventa
}

homeView.init = function() {
    // Glavni ekran
    const scr = dxui.View.build('home_screen', dxui.Utils.LAYER.MAIN);
    homeView.screen = scr;
    scr.scroll(false);
    scr.bgColor(COLORS.BACKGROUND);

    // 1. Gornja info traka (Status Bar)
    const statusBar = dxui.View.build('statusBar', scr);
    clearStyle(statusBar);
    statusBar.setSize(480, 40);
    statusBar.align(dxui.Utils.ALIGN.TOP_LEFT, 5, 5); // Ažurirana pozicija
    statusBar.flexFlow(dxui.Utils.FLEX_FLOW.ROW);
    statusBar.flexAlign(dxui.Utils.FLEX_ALIGN.SPACE_BETWEEN, dxui.Utils.FLEX_ALIGN.CENTER, dxui.Utils.FLEX_ALIGN.CENTER);

    // Lijevi dio statusne trake (vrijeme i datum)
    const timeContainer = dxui.View.build('timeContainer', statusBar);
    clearStyle(timeContainer);
    timeContainer.flexFlow(dxui.Utils.FLEX_FLOW.COLUMN);
    timeContainer.flexAlign(dxui.Utils.FLEX_ALIGN.CENTER, dxui.Utils.FLEX_ALIGN.START, dxui.Utils.FLEX_ALIGN.START);
    
    homeView.timeLabel = buildLabel('timeLabel', timeContainer, 16, "00:00", COLORS.PRIMARY_TEXT, dxui.Utils.FONT_STYLE.BOLD);
    homeView.dateLabel = buildLabel('dateLabel', timeContainer, 14, "...", COLORS.SECONDARY_TEXT);

    // Desni dio statusne trake (ikone)
    const iconContainer = dxui.View.build('iconContainer', statusBar);
    clearStyle(iconContainer);
    iconContainer.flexFlow(dxui.Utils.FLEX_FLOW.ROW);
    iconContainer.flexAlign(dxui.Utils.FLEX_ALIGN.END, dxui.Utils.FLEX_ALIGN.CENTER, dxui.Utils.FLEX_ALIGN.CENTER);
    iconContainer.obj.lvObjSetStylePadGap(15, 0); // Povećan razmak između ikona

    homeView.dndIcon = buildLabel('dndIcon', iconContainer, 16, dxui.Utils.BELL, COLORS.ACCENT);
    homeView.wifiIcon = buildLabel('wifiIcon', iconContainer, 16, dxui.Utils.WIFI, COLORS.PRIMARY_TEXT);

    // Siguran način za dodavanje paddinga pomoću "spacer" view-a
    const rightSpacer = dxui.View.build('statusBar_right_spacer', statusBar);
    clearStyle(rightSpacer);
    rightSpacer.setSize(15, 40);

    // 2. Središnji dio (Broj sobe i status)
    const centerContainer = dxui.View.build('centerContainer', scr);
    clearStyle(centerContainer);
    centerContainer.setSize(480, 120);
    centerContainer.align(dxui.Utils.ALIGN.TOP_MID, 0, 70);
    centerContainer.flexFlow(dxui.Utils.FLEX_FLOW.COLUMN);
    centerContainer.flexAlign(dxui.Utils.FLEX_ALIGN.CENTER, dxui.Utils.FLEX_ALIGN.CENTER, dxui.Utils.FLEX_ALIGN.CENTER);
    centerContainer.obj.lvObjSetStylePadGap(5, 0);
    
    homeView.roomNumberLabel = buildLabel('roomNumLabel', centerContainer, 120, String(config.get("controller.roomAddress")), COLORS.PRIMARY_TEXT, dxui.Utils.FONT_STYLE.BOLD);
    // homeView.roomStatusLabel = buildLabel('roomStatusLabel', centerContainer, 16, "Soba prazna", COLORS.SECONDARY_TEXT);

    // 3. Donji interaktivni elementi (Kartice)
    const cardContainer = dxui.View.build('cardContainer', scr);
    clearStyle(cardContainer);
    cardContainer.setSize(480, 120);
    cardContainer.align(dxui.Utils.ALIGN.BOTTOM_MID, 0, -15);
    cardContainer.flexFlow(dxui.Utils.FLEX_FLOW.ROW);
    cardContainer.flexAlign(dxui.Utils.FLEX_ALIGN.SPACE_AROUND, dxui.Utils.FLEX_ALIGN.CENTER, dxui.Utils.FLEX_ALIGN.CENTER);

    // Kreiranje tri kartice
    const cardRfid = buildCard('cardRfid', cardContainer, "rfid.png", "Prinesite karticu");
    const cardPin = buildCard('cardPin', cardContainer, "padlock.png", "Unesite PIN");
    const cardQr = buildCard('cardQr', cardContainer, "qrcode.png", "Skenirajte QR");

    // Dodavanje funkcionalnosti na klik (primjer)
    cardPin.on(dxui.Utils.EVENT.CLICK, () => {
        console.log("PIN kartica kliknuta!");
        // Učitavanje ekrana za lozinku, kao u mainView.js
        dxui.loadMain(passwordView.screen_password);
    });

    // // 4. Jezik (Donji desni kut)
    // homeView.langLabel = buildLabel('langLabel', scr, 12, "🌐 ENG", COLORS.SECONDARY_TEXT);
    // homeView.langLabel.align(dxui.Utils.ALIGN.BOTTOM_RIGHT, -15, -10);

    // Dinamičko ažuriranje vremena i datuma, kao u mainView.js
    homeView.timer = std.setInterval(() => {
        try {
            const now = utils.getDateTime();
            const timeString = `${now.hours}:${now.minutes}`;
            const dateString = `${now.dayTextBs} ${now.day}.${now.month}.${now.year}.`;
            
            if (homeView.lastTime !== timeString) {
                homeView.timeLabel.text(timeString);
                homeView.lastTime = timeString;
            }
            if (homeView.lastDate !== dateString) {
                homeView.dateLabel.text(dateString);
                homeView.lastDate = dateString;
            }
        } catch (e) {
            console.log("Error updating time: " + e);
        }
    }, 1000);

    // Očisti tajmer kada se ekran uništi
    scr.on(dxui.Utils.ENUM.LV_EVENT_SCREEN_UNLOADED, () => {
        if (homeView.timer) {
            std.clearInterval(homeView.timer);
        }
    });
};

export default homeView;
