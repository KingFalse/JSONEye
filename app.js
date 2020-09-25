import {MDCDrawer} from "@material/drawer";
import {MDCTopAppBar} from "@material/top-app-bar";
import {MDCLinearProgress} from '@material/linear-progress';
import {MDCTooltip} from '@material/tooltip';
import moment from "moment";
import * as monaco from 'monaco-editor';


const topAppBar = MDCTopAppBar.attachTo(document.getElementById('app-bar'));
topAppBar.setScrollTarget(document.getElementById('main-content'));
topAppBar.listen('MDCTopAppBar:nav', () => {
    drawer.open = !drawer.open;
});

const drawer = MDCDrawer.attachTo(document.querySelector('.mdc-drawer'));
const listEl = document.querySelector('.mdc-drawer .mdc-list');
const mainContentEl = document.querySelector('.main-content');
listEl.addEventListener('click', (event) => {
    drawer.open = false;
    editor.focus();
});


const tooltips = [].map.call(document.querySelectorAll('.mdc-tooltip'), function (el) {
    return new MDCTooltip(el);
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

monaco.languages.registerHoverProvider('json', {

    provideHover: function (model, position) {
        return {
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, model.getLineMaxColumn(position.lineNumber)),
            contents: [
                {value: '**概览**'},
                , {
                    value: getAlertMessage(position.lineNumber - 1)
                }
            ]
        }
    }
});

function getAlertMessage(lineNumber) {
    if (monaco.editor.getModelMarkers({}).length > 0) return
    if (isContentChange) {
        return "修改内容后需要重新格式化"
    } else {
        try {
            let path = paths[lineNumber]
            let date = dates[lineNumber]
            let time = times[lineNumber]
            let resx = getLineBase64Decode(lineNumber)
            let de64 = resx.de64
            let size = resx.size
            let info = "" +
                "|               |               |\n" +
                "|:------------- |:--------------|\n" +
                "| JSONPath:     | " + path + "  |\n" +
                ""
            if (date.isNotEmpty()) {
                info += "" +
                    "| 时间格式化:     | " + date + "  |\n" +
                    "|               | [查看更多格式...](https://www.baidu.com/?ts=" + time + ")  |\n"
            }
            if (de64.isNotEmpty()) {
                info += "" +
                    "| 字符串长度:     | " + size + "  |\n" +
                    "| Base64解码:    | " + de64 + "  |\n"
            }
            return info
        } catch (e) {
            console.log(e)
            // return "请重新格式化"
        }
    }
}

function getLineBase64Decode(lineNumber) {
    let xx = getLineStringVal(lineNumber)
    let de = Buffer.from(xx, 'base64').toString()
    let ed = Buffer.from(de).toString('base64')
    return {"de64": xx == ed ? de : "", "size": xx.length};
}

/**
 * 获取指定行的字符串值
 * @param lineNumber
 */
function getLineStringVal(lineNumber) {
    let lineText = getClearJson().split(/\n/)[lineNumber]
    if (lineText.match(/"\s*:\s*"/)) {
        let value = lineText.split(/"\s*:\s*"/)[1]
        return value.substring(0, value.lastIndexOf('"'))
    }
    return ""
}

// 编辑器初始化
let editor = monaco.editor.create(document.getElementById('main-content'), {
    value: [
        '{\n' +
        '    "title": "欢迎使用JSONEye",\n' +
        '    "desc": "给个星星吧,嘤嘤嘤",\n' +
        '    "github": "https://github.com/KingFalse/JSONEye",\n' +
        '    "文本比对": "https://jsoneye.cn/compare.html"\n' +
        '}',
    ].join('\n'),
    contextmenu: false,
    quickSuggestions: false,
    automaticLayout: true,
    formatOnType: true,
    language: 'json',
});
let onFocus = editor.onDidFocusEditorText(function () {
    document.querySelector("#mask").style.zIndex = -1
    onFocus.dispose()
    reCat()
})

editor.focus()
window.onresize = function () {
    editor.layout();
};
editor.onDidPaste(function (e) {
    reformat.click();
})

let isContentChange = false
editor.onDidChangeModelContent(e => {
    isContentChange = true
});

const linearProgress = new MDCLinearProgress(document.querySelector('.mdc-linear-progress'));


/////////////////////////////////
const reduce = document.querySelector('#reduce');
reduce.addEventListener('click', (event) => {
    let reduce_json = getClearJson().split(/[\r|\n]/).map(function (line) {
        return line.trimLeft()
    }).join("").replace(/": /g, '":')
    editor.setValue(reduce_json)
    paths, dates, times = []
});
const zoom_in = document.querySelector('#zoom_in');
zoom_in.addEventListener('click', (event) => {
    editor.trigger('keyboard', 'editor.action.fontZoomIn', {});
});
const zoom_out = document.querySelector('#zoom_out');
zoom_out.addEventListener('click', (event) => {
    editor.trigger('keyboard', 'editor.action.fontZoomOut', {});
});
const search = document.querySelector('#search');
search.addEventListener('click', (event) => {
    editor.getAction('actions.find').run();
});
const unfold_less = document.querySelector('#unfold_less');
unfold_less.addEventListener('click', (event) => {
    editor.getAction('editor.foldAll').run();
});
const unfold_more = document.querySelector('#unfold_more');
unfold_more.addEventListener('click', (event) => {
    editor.getAction('editor.unfoldAll').run();
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

let paths, dates, times = []
let last_ver = ""
const reformat = document.querySelector('#reformat');

reformat.addEventListener('click', (event) => reCat());

function reCat() {
    //判断没有报错红线
    if (monaco.editor.getModelMarkers({}).length === 0) {
        let now_ver = getClearJson()
        if (last_ver !== now_ver) {
            //说明不单单是动了注释，需要重新计算相关信息
            editor.getAction('editor.action.formatDocument').run().then(() => {
                last_ver = getClearJson()
                paths = getJsonPathList(last_ver);
                dates = getDateFormatList(last_ver);
                isContentChange = false
            });
        }
        // else {
        //     console.log("只懂了注释，不计算了")
        // }
        isContentChange = false
        editor.setScrollPosition({scrollTop: 0, scrollLeft: 0});
    } else {
        editor.getAction('editor.action.marker.nextInFiles').run()
    }
}

/**
 * 从格式化好的JSON中找出10位，13位的时间戳
 * @param json
 */
function getDateFormatList(json) {
    times = []
    return json.split(/\n/).map(function (line) {
        let t13 = /:\s*\"?(1\d{12})\"?\,?$/
        let t10 = /:\s*\"?(1\d{9})\"?\,?$/
        let r = t13.test(line) == true ? line.match(t13)[1] * 1 : 0
        r = t10.test(line) == true ? line.match(t10)[1] * 1000 : 0
        if (r == 0) {
            times.push(0)
            return ""
        }
        times.push(r)
        return moment(r).format(moment.HTML5_FMT.DATETIME_LOCAL_MS)
    })
}


/**
 * 获取去除单行注释的格式化好的JSON
 * @returns {string}
 */
function getClearJson() {
    return editor.getValue().split(/\n/).map(function (line) {
        return line.replace(/\s+\/\/\s*[\d\D]*$/, '');
    }).join('\n')
}


/////////////////////计算JSONPath////////////////////////
function getJsonPathList(json) {
    /**
     * 获取当前行的key
     * @param line
     * @returns {string}
     */
    function getLineNodeKey(line) {
        let index_a = line.indexOf('"') + 1;
        let index_b = line.indexOf('":', index_a);
        if (0 > index_a || 0 > index_b) {
            return ""
        }
        return line.substring(index_a, index_b)
    }

    /**
     * 获取字符串开头空格的数量
     * @param line
     */
    function getLinePrefixSpaceCount(line) {
        return line.length - line.replace(/^\s*/, "").length
    }

    /**
     * 获取上层元素是数组时需要补齐的层数
     * @param jp
     * @returns {number}
     */
    function getPrefix(jp) {
        let replace = jp.replace("].[", "")
        let length = replace.length
        let key = ".["
        return (length - replace.replace(key, "").length) / key.length
    }

    /**
     * 从给定的JSONPath中截取前N层
     * @param jp
     * @param count
     * @returns {string}
     */
    String.prototype.subJsonPath = function (count) {
        return this.split('.').slice(0, count).join('.')
    }

    String.prototype.isEmpty = function () {
        return this.length === 0
    }
    String.prototype.isNotEmpty = function () {
        return this.length !== 0
    }

    let lines = json.split(/\n/);
    let step = 4
    let jp = "$"
    let map = new Map()

    let results = lines.map(function (line) {
        let layers = getLinePrefixSpaceCount(line) / step//计算层数
        if (layers < 1) {
            return "$"
        } else {
            let item_base = jp.subJsonPath(layers)
            let nodeKey = getLineNodeKey(line)
            if (line.trim().endsWith("{")) {
                if (nodeKey.isNotEmpty()) {//上层是对象
                    jp = item_base + "." + nodeKey
                } else if (nodeKey.isEmpty() && layers !== 0) {
                    let item_index = map.has(line) ? map.get(line) : 0
                    jp = jp.replace(/\[\d*\]$/, "[" + item_index + "]")
                    map.set(line, item_index + 1)
                }
                return jp
            } else if (line.trim().endsWith("[")) {
                if (nodeKey.isNotEmpty()) {
                    jp = item_base + "." + nodeKey + ".[]"
                    return item_base + "." + nodeKey
                } else {
                    jp = jp + ".[]"
                    let prefix = getPrefix(jp)
                    jp = jp.subJsonPath(layers + prefix)
                    let key = jp.replace(/\[\d*\]$/, "")
                    let item_index = map.has(key) ? map.get(key) : 0
                    jp = jp.replace(/\[\d*\]$/, "[" + item_index + "]")
                    map.set(key, item_index + 1)
                    return jp
                }
            } else if (line.trim().endsWith("},")) {
                return ""
            } else if (line.trim().endsWith("}")) {
                return ""
            } else if (line.trim().endsWith("],")) {
                if (jp.endsWith("]")) {
                    jp = jp.replace(/\.\[\d*\]$/, "")
                } else {
                }
                return ""
            } else if (line.trim().endsWith("]")) {
                if (jp.endsWith("]")) {
                    jp = jp.replace(/\.\[\d*\]$/, "")
                }
                return ""
            } else {//有可能是数组元素
                if (nodeKey.isEmpty()) {
                    jp = jp + ".[]"
                    let prefix = getPrefix(jp)
                    jp = jp.subJsonPath(layers + prefix)
                    let key = jp.replace(/\[\d*\]$/, "")
                    let item_index = map.has(key) ? map.get(key) : 0
                    jp = jp.replace(/\[\d*\]$/, "[" + item_index + "]")
                    map.set(key, item_index + 1)
                    return jp
                } else {
                    return item_base + "." + nodeKey
                }
            }

        }
    });
    return results
}

/////////////////////计算JSONPath////////////////////////

