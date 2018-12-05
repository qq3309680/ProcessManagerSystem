var Class = {
    //创建类
    create: function () {
        return function () {
            this.initialize.apply(this, arguments);
        };
    },
    create: function (id) {
        return function (id) {
            this.initialize.apply(this, arguments, id);
        };
    }
};
var __A = function (a) {
    //转换数组
    return a ? Array.apply(null, a) : new Array;
};
var __ = function (id) {
    //获取对象
    return document.getElementById(id);
};
Object.extend = function (a, b) {
    //追加方法
    for (var i in b) a[i] = b[i];
    return a;
};
Object.extend(Object, {
    addEvent: function (a, b, c, d) {
        //添加函数
        if (a.attachEvent) a.attachEvent(b[0], c);
        else a.addEventListener(b[1] || b[0].replace(/^on/, ""), c, d || false);
        return c;
    },

    delEvent: function (a, b, c, d) {
        if (a.detachEvent) a.detachEvent(b[0], c);
        else a.removeEventListener(b[1] || b[0].replace(/^on/, ""), c, d || false);
        return c;
    },

    reEvent: function () {
        //获取Event
        return window.event ? window.event : (function (o) {
            do {
                o = o.caller;
            } while (o && !/^\[object[ A-Za-z]*Event\]$/.test(o.arguments[0]));
            return o.arguments[0];
        })(this.reEvent);
    }

});
Function.prototype.bind = function () {
    //绑定事件
    var wc = this; var a = __A(arguments);
    //shift()用于把数组的第一个元素删除，并返回剩余的数组
    var o = a.shift();
    return function () {
        wc.apply(o, a.concat(__A(arguments)));
    };
};
var CDrag = Class.create();
CDrag.IE = /MSIE/.test(window.navigator.userAgent);
//表
CDrag.Table = Class.create();
CDrag.Table.prototype = {
    //列的拖拽暂时不考虑
    initialize: function () {

        //初始化
        var wc = this;
        wc.items = []; //创建列组
    },

    add: function () {
        //添加列
        var wc = this, id = wc.items.length, arg = arguments;

        var colId = arg[1];

        return wc.items[id] = new CDrag.Table.Cols(colId, wc, arg[0]);
    }
};
//列
CDrag.Table.Cols = Class.create();

CDrag.Table.Cols.prototype = {

    initialize: function (id, parent, element) {
        //初始化
        var wc = this;
        wc.items = []; //创建列组
        wc.id = element.id;
        wc.parent = parent;
        wc.element = element;
    },

    add: function () {

        //添加行
        var wc = this, id = wc.items.length, arg = arguments;

        var rowid = arg[0];

        return wc.items[id] = new CDrag.Table.Rows(rowid, wc, arg[0], arg[1]);
    },

    ins: function (num, row) {
        //插入行
        var wc = this, items = wc.items, i;

        if (row.parent == wc && row.id < num) num--; //同列向下移动的时候
        for (i = num ; i < items.length ; i++) items[i].id++;

        items.splice(num, 0, row);
        row.id = num, row.parent = wc;

        return row;
    },

    del: function (num) {
        //删除行
        var wc = this, items = wc.items, i;

        if (num >= items.length) return;
        for (i = num + 1; i < items.length ; i++) items[i].id = i - 1;
        return items.splice(num, 1)[0];
    }

};
//行
CDrag.Table.Rows = Class.create();
CDrag.Table.Rows.prototype = {


    initialize: function (id, parent, element, window) {
        //初始化
        var wc = this, temp;
        wc.id = id;
        wc.parent = parent;
        wc.root_id = element;
        wc.window = window;
        wc.element = wc.element_init();
        temp = wc.element.childNodes[CDrag.IE ? 0 : 1];

        wc.title = temp.childNodes[0];
        wc.reduce = temp.childNodes[1];
        wc.close = temp.childNodes[2];
        wc.content = wc.element.childNodes[CDrag.IE ? 1 : 3];

        wc.mousedown = wc.reduceFunc = wc.closeFunc = null;

        wc.load(database.json);
    },

    element_init: function () {
        //初始化元素
        var wc = this, div = __("root_row").cloneNode(true);

        wc.parent.element.appendChild(div);
        div.style.display = "block";
        return div;
    },

    load: function (datajson) {
        //加载信息--database数据信息
        var wc = this;
        var info = database.parse(wc.root_id, datajson);
        //console.dir(wc.root_id);
        //console.dir(wc);
        wc.title.innerHTML = info.branch + "_" + info.column + "_" + info.row;
        wc.content.innerHTML = info.content;
        wc.element.setAttribute("row", info.row);
        if (wc.window == 0) {
            wc.content.style.display = "none";
            wc.reduce.innerHTML = "放大";
        } else {
            wc.content.style.display = "block";
            wc.reduce.innerHTML = "缩小";
        }


        wc.content.style.display = (wc.window == 0 ? "none" : "block");
    }

};

CDrag.prototype = {

    initialize: function (id) {
        var child = document.createElement("div");
        child.id = id;
        child.className = "root";
        __("body").appendChild(child);
        //初始化成员
        var wc = this;
        wc.table = new CDrag.Table; //建立表格对象
        wc.iFunc = wc.eFunc = null;
        wc.obj = { on: { a: null, b: "" }, row: null, left: 0, top: 0 };
        wc.temp = { row: null, div: document.createElement("div") };//拖拽的div，站位div
        wc.temp.div.setAttribute(CDrag.IE ? "className" : "class", "CDrag_temp_div");
        wc.temp.div.innerHTML = "&nbsp;";
    },




    reMouse: function (a) {
        //获取鼠标位置
        var e = Object.reEvent();
        return {
            x: document.documentElement.scrollLeft + e.clientX,
            y: document.documentElement.scrollTop + e.clientY
        };
    },

    rePosition: function (o) {
        //获取元素绝对位置
        var __x = __y = 0;
        do {
            __x += o.offsetLeft;
            __y += o.offsetTop;
        } while ((o = o.offsetParent)); // && o.tagName != "BODY"
        return { x: __x, y: __y };
    },

    sMove: function (o) {
        //当拖动开始时设置参数

        var wc = this;
        if (wc.iFunc || wc.eFinc) return;

        var mouse = wc.reMouse(), obj = wc.obj, temp = wc.temp, div = o.element, position = wc.rePosition(div);

        obj.row = o;
        obj.on.b = "me";
        obj.left = mouse.x - position.x;
        obj.top = mouse.y - position.y;

        temp.row = document.body.appendChild(div.cloneNode(true)); //复制预拖拽对象

        with (temp.row.style) {
            //设置复制对象
            position = "absolute";
            left = mouse.x - obj.left + "px";
            top = mouse.y - obj.top + "px";
            zIndex = 100;
            opacity = "0.3";
            filter = "alpha(opacity:30)";
        }

        with (temp.div.style) {
            //设置站位对象
            height = div.clientHeight + "px";
            width = div.clientWidth + "px";
        }

        var dragnoderow = o.element.children[0].children[0].innerHTML.split("_")[2];

        temp.div.setAttribute("row", dragnoderow);//设置站位div所在row


        wc.move_start_position = position;//拖动的节点初始位置

        wc.node_element = o.element;

        div.parentNode.replaceChild(temp.div, div);

        wc.iFunc = Object.addEvent(document, ["onmousemove"], wc.iMove.bind(wc));
        wc.eFunc = Object.addEvent(document, ["onmouseup"], wc.eMove.bind(wc));
        document.onselectstart = new Function("return false");
    },

    iMove: function () {
        //当鼠标移动时设置参数

        var wc = this, mouse = wc.reMouse(), cols = wc.table.items, obj = wc.obj, temp = wc.temp,
         row = obj.row, div = temp.row, t_position, t_cols, t_rows, i, j;

        var m_row_position = wc.move_start_position;

        var m_cols = wc.obj.row.parent.items;

        with (div.style) {
            left = mouse.x - obj.left + "px";
            top = mouse.y - obj.top + "px";
        }


        var other_move = obj.row.parent.element.getElementsByClassName("move");

        //console.dir(temp.div);

        if (other_move.length != 0) {

            for (var i = 0; i < other_move.length; i++) {

                t_position = wc.rePosition(other_move[i]);

                var distance = Math.abs(mouse.y - t_position.y);

                if (mouse.y > t_position.y && mouse.y < t_position.y + 60) {

                    var temp_div = other_move[i];

                    var emptydivrow = temp.div.getAttribute("row");

                    var changenoderow = temp_div.getAttribute("row");

                    temp_div.children[0].children[0].innerHTML = temp_div.children[0].children[0].innerHTML.split("_")[0] + "_" + temp_div.children[0].children[0].innerHTML.split("_")[1] + "_" + emptydivrow;
                    temp_div.setAttribute("row", emptydivrow);
                    temp_div.parentNode.replaceChild(temp_div, temp.div);

                    if (emptydivrow < changenoderow) {
                        //向下
                        if (i + 1 == other_move.length) {

                            other_move[i].parentNode.appendChild(temp.div);

                        } else {

                            other_move[i].parentNode.insertBefore(temp.div, other_move[i + 1]);

                        }


                    } else {
                        //向上
                        if (i == 0) {

                            other_move[i].parentNode.insertBefore(temp.div, other_move[0]);

                        } else {

                            other_move[i].parentNode.insertBefore(temp.div, other_move[i]);

                        }
                    }

                    temp.div.setAttribute("row", changenoderow);

                }



            }

        }


    },

    eMove: function () {
        //当鼠标释放时设置参数
        console.dir("当鼠标释放时设置参数");

        var wc = this, obj = wc.obj, temp = wc.temp, row = obj.row, div = row.element, o_cols, n_cols, number;

        if (obj.on.b != "me") {

            number = (obj.on.b == "down" ? obj.on.a.id + 1 : 0);
            n_cols = (obj.on.b != "new" ? obj.on.a.parent : obj.on.a);
            o_cols = obj.row.parent;
            n_cols.ins(number, o_cols.del(obj.row.id));

        }

        var emptydivrow = temp.div.getAttribute("row");

        div.setAttribute("row", emptydivrow);

        div.children[0].children[0].innerHTML = div.children[0].children[0].innerHTML.split("_")[0] + "_" + div.children[0].children[0].innerHTML.split("_")[1] + "_" + emptydivrow;

        temp.div.parentNode.replaceChild(div, temp.div);
        temp.row.parentNode.removeChild(temp.row);
        delete temp.row;

        Object.delEvent(document, ["onmousemove"], wc.iFunc);
        Object.delEvent(document, ["onmouseup"], wc.eFunc);
        document.onselectstart = wc.iFunc = wc.eFunc = null;
    },

    add: function (o) {
        //添加对象
        var wc = this;


        o.mousedown = Object.addEvent(o.title, ["onmousedown"], wc.sMove.bind(wc, o));
        o.reduceFunc = Object.addEvent(o.reduce, ["onclick"], wc.reduce.bind(wc, o));
        o.closeFunc = Object.addEvent(o.close, ["onclick"], wc.close.bind(wc, o));
    },

    close: function (o) {

        //删除对象
        var wc = this, parent = o.parent;

        Object.delEvent(o.close, ["onclick"], o.closeFunc);
        Object.delEvent(o.reduce, ["onclick"], o.reduceFunc);
        Object.delEvent(o.title, ["onmousedown"], o.mousedown);
        o.closeFunc = o.reduceFunc = o.mousedown = null;

        var row = o.element.getAttribute("row");

        for (var i = 0; i < o.parent.items.length; i++) {

            if (row == o.parent.items.length) {
                //最后一个节点

            } else {

                var otherRow = o.parent.items[i].element;

                if (row < otherRow.getAttribute("row")) {
                    console.dir(otherRow.getAttribute("row"));

                    o.parent.items[i].element.setAttribute("row", otherRow.getAttribute("row") - 1);
                    otherRow.children[0].children[0].innerHTML = otherRow.children[0].children[0].innerHTML.split("_")[0] + "_" + otherRow.children[0].children[0].innerHTML.split("_")[1] + "_" + parseInt(otherRow.getAttribute("row"));
                }

            }


        }

        parent.element.removeChild(o.element);

        parent.del(o.id);

        delete o;
    },

    reduce: function (o) {
        //变大变小
        var wc = this;
        if ((o.window = (o.window == 1 ? 0 : 1))) {
            o.content.style.display = "block";
            o.reduce.innerHTML = "缩小";
        } else {
            o.content.style.display = "none";
            o.reduce.innerHTML = "放大";
        }
    },

    returnMaxId: function (id) {
        //返回列中的最大id
        var wc = this;
        for (var i = 0; i < wc.table.items.length; i++) {
            if (id == wc.table.items[i].id) {
                //wc.table.items[i].items.push({ id: wc.table.items[i].items.length, root_id: id + "_" + wc.table.items[i].items.length });
                return wc.table.items[i].items.length + 1;
            }
        }
    },

    addnodeevent: function (o) {

        var wc = this;

        var div = o.offsetParent;

        var cols;

        for (var i = 0; i < wc.table.items.length; i++) {
            if (wc.table.items[i].id == div.id) {
                cols = wc.table.items[i];
            }
        }

        var id = wc.returnMaxId(div.id);
        var branch = div.id.split("_")[0];
        var column = parseInt(div.id.split("_")[1]) + 1;
        var type;

        //获取类型
        $.each(database.json, function (key, val) {
            if (val.id.indexOf(div.id) > -1) {
                type = val.type;
                return false;//跳出本次循环
            }
        });

        var databaseitem = { id: div.id + "_" + id, title: div.id + "_" + id, content: "新节点", type: type, branch: branch, column: column, row: id, sort: id };


        database.json.push(databaseitem);

        wc.add(cols.add(div.id + "_" + id, 1));

    },
    parse: function (o, rootid) {
        //初始化成员
        try {
            var wc = this, table = wc.table, cols, rows, div, i, j;

            //创建列div
            for (i = 0 ; i < o.length ; i++) {
                var child = document.createElement("div");
                child.id = o[i].cols;
                child.className = "cell";
                __(rootid).appendChild(child);
                //创建每一次的增加单元格的“加号”
                var addchild = document.createElement("div");
                addchild.id = "addnode" + o[i].cols;
                addchild.innerHTML = "+";
                addchild.className = "addnode";
                __(child.id).appendChild(addchild);
                //绑定“加号”事件
                Object.addEvent(addchild, ["onclick"], wc.addnodeevent.bind(wc, addchild));

                if (i < o.length - 1) {
                    var childnbsp = document.createElement("div");
                    childnbsp.className = "r_nbsp";
                    childnbsp.innerHTML = "&nbsp;";
                    __(rootid).appendChild(childnbsp);
                }

            }

            //增加列及行
            for (i = 0 ; i < o.length ; i++) {


                div = __(o[i].cols), cols = table.add(div, o[i].cols);

                for (j = 0 ; j < o[i].rows.length ; j++) {

                    wc.add(cols.add(o[i].rows[j].id, o[i].rows[j].window));
                }
            }
        } catch (exp) {
            console.dir(exp);
        }
    }

};
Object.addEvent(window, ["onload"], function () {

    var json = [

       {
           cols: "1_0", rows: [
            { id: "1_0_1", window: 1 }
           ]
       },

      {
          cols: "1_1", rows: [
           { id: "1_1_1", window: 1 },
           { id: "1_1_2", window: 1 }
          ]
      },

     {
         cols: "1_2", rows: [
          { id: "1_2_1", window: 1 },
         ]
     },

     {
         cols: "1_3", rows: [
          { id: "1_3_1", window: 1 },
          { id: "1_3_2", window: 1 },
          { id: "1_3_3", window: 1 }
         ]

     },
     {
         cols: "1_4", rows: [
          { id: "1_4_1", window: 1 }
         ]
     }
     ,

     {
         cols: "1_5", rows: [
          { id: "1_5_1", window: 1 }
         ]
     }

    ];


    var wc = new CDrag("root");
    wc.parse(json, "root");




    var json1 = [

      {
          cols: "2_0", rows: [
           { id: "2_0_1", window: 1 }
          ]
      },

     {
         cols: "2_1", rows: [
          { id: "2_1_1", window: 1 },
          { id: "2_1_2", window: 1 }
         ]
     },

    {
        cols: "2_2", rows: [
         { id: "2_2_1", window: 1 },
        ]
    },

    {
        cols: "2_3", rows: [
         { id: "2_3_1", window: 1 },
         { id: "2_3_2", window: 1 },
         { id: "2_3_3", window: 1 }
        ]
    },

    {
        cols: "2_4", rows: [
         { id: "2_4_1", window: 1 }
        ]
    }
    ,

    {
        cols: "2_5", rows: [
         { id: "2_5_1", window: 1 }
        ]
    }

    ];


    var wc1 = new CDrag("root1");
    wc1.parse(json1, "root1");


});


var database = {
    json: [
       { id: "1_0_1", content: "需要", type: "条件", branch: 1, column: 1, row: 1, sort: 1 },

       { id: "1_1_1", content: "发起人", type: "发起", branch: 1, column: 2, row: 1, sort: 1 },

       { id: "1_1_2", content: "直接上级", type: "发起", branch: 1, column: 2, row: 2, sort: 2 },

       { id: "1_2_1", content: "法务", type: "专业审批", branch: 1, column: 3, row: 1, sort: 1 },


       { id: "1_3_1", content: "高层级审批", type: "权责审批", branch: 1, column: 4, row: 1, sort: 1 },

       { id: "1_3_2", content: "分管领导", type: "权责审批", branch: 1, column: 4, row: 2, sort: 2 },

       { id: "1_3_3", content: "总裁", type: "权责审批", branch: 1, column: 4, row: 3, sort: 3 },

       { id: "1_4_1", content: "机要秘书", type: "执行/知会", branch: 1, column: 5, row: 1, sort: 1 },

        { id: "1_5_1", content: "归档", type: "归档", branch: 1, column: 6, row: 1, sort: 1 },

        { id: "2_0_1", content: "不需要", type: "条件", branch: 2, column: 1, row: 1, sort: 1 },

       { id: "2_1_1", content: "发起人", type: "发起", branch: 2, column: 2, row: 1, sort: 1 },

       { id: "2_1_2", content: "直接上级", type: "发起", branch: 2, column: 2, row: 2, sort: 2 },

       { id: "2_2_1", content: "法务", type: "专业审批", branch: 2, column: 3, row: 1, sort: 1 },

       { id: "2_3_1", content: "高层级审批", type: "权责审批", branch: 2, column: 4, row: 1, sort: 1 },

       { id: "2_3_2", content: "分管领导", type: "权责审批", branch: 2, column: 4, row: 2, sort: 2 },

       { id: "2_3_3", content: "总裁", type: "权责审批", branch: 2, column: 4, row: 3, sort: 3 },

       { id: "2_4_1", content: "机要秘书", type: "归档", branch: 2, column: 5, row: 1, sort: 1 },

        { id: "2_5_1", content: "归档", type: "归档", branch: 2, column: 6, row: 1, sort: 1 }

    ],

    parse: function (id, jsondata) {
        //昂应该用AJAX查找然后返回数据..我这里就拿..json串模拟好了嘿
        var wc = this, i;
        for (i in jsondata) {
            if (jsondata[i].id == id)
                return { title: jsondata[i].title, content: jsondata[i].content, type: jsondata[i].type, branch: jsondata[i].branch, column: jsondata[i].column, row: jsondata[i].row };
        }
    }
};

