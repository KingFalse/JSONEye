import {MDCDrawer} from "@material/drawer";
import * as monaco from 'monaco-editor';
import {MDCTopAppBar} from "@material/top-app-bar";

import {MDCSnackbar} from '@material/snackbar';
import {MDCLinearProgress} from '@material/linear-progress';

import {MDCTooltip} from '@material/tooltip';

const tooltips = [].map.call(document.querySelectorAll('.mdc-tooltip'), function (el) {
    return new MDCTooltip(el);
});

const snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));

const drawer = MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));


const listEl = document.querySelector('.mdc-drawer .mdc-list');
const mainContentEl = document.querySelector('.main-content');

listEl.addEventListener('click', (event) => {
    drawer.open = false;
    editor.focus();
});

[].map.call(document.querySelectorAll('.mdc-drawer__content .mdc-list-item:not(.mdc-list-item--activated)'), function (el) {
    el.addEventListener('click', (event) => {
        linearProgress.open();
        document.querySelector("#mask").style.zIndex = 999;
    });
});

document.body.addEventListener('MDCDrawer:closed', () => {
    mainContentEl.querySelector('input, button').focus();
});

self.MonacoEnvironment = {
    getWorkerUrl: function () {
        return './json.worker.bundle.js';
    }
}
// 编辑器初始化
let originalModel = monaco.editor.createModel("heLLo world!", "text/plain");
let modifiedModel = monaco.editor.createModel("hello orlando!", "text/plain");

let editor = monaco.editor.createDiffEditor(document.getElementById("main-content"), {
    originalEditable: true,
    readOnly: false,
});
editor.setModel({
    scrollBeyondLastLine: true,
    original: originalModel,
    modified: modifiedModel
});
editor.focus();
window.onresize = function () {
    editor.layout();
};

let onDidChangeDecorations = originalModel.onDidFocusEditorText(e => {
    document.querySelector("#mask").style.zIndex = -1
    onDidChangeDecorations.dispose()
});

let linearProgress = new MDCLinearProgress(document.querySelector('.mdc-linear-progress'));

let topAppBar = MDCTopAppBar.attachTo(document.getElementById('app-bar'));
topAppBar.setScrollTarget(document.getElementById('main-content'));
topAppBar.listen('MDCTopAppBar:nav', () => {
    drawer.open = !drawer.open;
});

document.querySelector('#zoom_in').addEventListener('click', (event) => {
    editor.trigger('keyboard', 'editor.action.fontZoomIn', {});
});
document.querySelector('#zoom_out').addEventListener('click', (event) => {
    editor.trigger('keyboard', 'editor.action.fontZoomOut', {});
});
document.querySelector('#search').addEventListener('click', (event) => {
    editor.getModifiedEditor().getAction('actions.find').run();
});

let inline_diff = true;
document.querySelector('#inline').addEventListener('click', (event) => {
    inline_diff = !inline_diff
    editor.updateOptions({
        renderSideBySide: inline_diff
    });
    if (inline_diff) {
        document.querySelector('#inline').innerHTML = "close_fullscreen"
    } else {
        document.querySelector('#inline').innerHTML = "open_in_full"
    }
});

let def_theme = 'vs'
const theme = document.querySelector('#theme');
theme.addEventListener('click', (event) => {
    if (def_theme === 'vs') {
        def_theme = 'vs-dark'
        monaco.editor.setTheme(def_theme);
        theme.innerHTML = 'wb_sunny'
    } else if (def_theme === 'vs-dark') {
        def_theme = 'vs'
        monaco.editor.setTheme(def_theme);
        theme.innerHTML = 'nights_stay'
    }
});