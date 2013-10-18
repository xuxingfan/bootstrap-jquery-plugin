/**
* jquery.bootstrap.js
Copyright (c) Kris Zhang <kris.newghost@gmail.com>
License: MIT 
*/
/* Extend string method */

/*
string.format, ref: http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format/4673436#4673436
*/
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}/*
Description: $.fn.dialog
Author: Kris Zhang
*/
(function($) {

  $.fn.dialog = function(options) {

    var self    = this
      , $this   = $(self)
      , $body   = $(document.body)
      , $msgbox = $this.closest(".dialog");

    var create = function(msg, func, opts) {

      var msghtml
        = ''
        // + '<div class="dialog">'
        // + '<div class="msg">'
        // +   '<h3 class="msgh"></h3>'
        // +   '<div class="msgb"></div>'
        // +   '<table class="msgf">'
        // +   '<tr></tr>'
        // +   '</table>'
        // + '</div>'
        // + '<div class="mask"></div>'
        // + '</div>'
        + '<div class="dialog modal fade in">'
        + '<div class="modal-dialog">'
        +   '<div class="modal-content">'
        +     '<div class="modal-header">'
        +         '<button type="button" class="close">×</button>'
        +         '<h4 class="modal-title"></h4>'
        +     '</div>'
        +     '<div class="modal-body"></div>'
        +     '<div class="modal-footer"></div>'
        +   '</div>'
        + '</div>'
        + '<div class="modal-backdrop fade in" style="z-index:-1"></div>'
        + '</div>'
        ;


      $msgbox = $(msghtml);
      $(document.body).append($msgbox);
      $msgbox.find(".modal-body").append($this);
      
      //bind event & show
      $(".modal-header .close").click(close);
    };

    var createButton = function() {
      var buttons = options.buttons || {}
        , $btnrow = $msgbox.find(".modal-footer");

      //clear old buttons
      $btnrow.html('');

      for (var button in buttons) {
        var btnObj  = buttons[button]
          , id      = ""
          , text    = ""
          , classed = "btn-default"
          , click   = "";

        if (btnObj.constructor == Object) {
          id      = btnObj.id;
          text    = btnObj.text;
          classed = btnObj.classed || classed;
          click   = btnObj.click;
        }

        if (btnObj.constructor == Function) {
          click = btnObj;
        }

        //<button data-bb-handler="danger" type="button" class="btn btn-danger">Danger!</button>
        $button = $('<button type="button" class="btn {1}">{0}</button>'.format(text, classed));

        id && $button.attr("id", id);
        if (click) {
          (function(click) {
            $button.click(function() {
              console.log("click", click);
              click.call(self);
            });
          })(click);
        }

        $btnrow.append($button);
      }
    };

    var show = function() {
      $msgbox.show();
      $body.addClass("modal-open");
    };

    var close = function() {
      $msgbox.hide();
      $body.removeClass("modal-open");
    };

    if (options.constructor == Object) {
      if ($msgbox.size() < 1) {
        create();
      }
      createButton();
      $(".modal-title", $msgbox).html(options.title || "");
      show();
    }

    if (options == "destroy") {
      close();
      $msgbox.remove();
    }

    if (options == "close") {
      close();
    }

    if (options == "open") {
      show();
    }

    return $this;
  };

})(jQuery);/*
Description: $.fn.combobox
Author: Kris Zhang
require: 
  string.js
  jquery.dialog.js
*/

(function($) {

  //tips for edit fields
  var tips = {};

  $.fn.datagrid = function(method, options) {

    var $this = $(this);

    var bindRows = function($rows) {
      var onSelect = $this.data("onSelect")
        , conf     = $this.data("config");

      var clickHandler = function() {
        //rows may added dynamiclly
        $("tbody tr", $this).removeClass("selected");
        $(this).addClass("selected");
        onSelect && onSelect();
      };

      (conf.del || onSelect) && $rows.click(clickHandler);

      $("input + .tip", $rows).click(function() {
        var $icon = $(this)
          , id    = "tip-" + $icon.attr("data-field");

        //There is more than one tips? popup message.
        $("#{0} ul li".format(id)).size() > 1
          &&  $("#" + id).dialog({
                title: "请选择一个值",
                buttons: [
                  { "关闭": function() {  
                    $(this).dialog("destroy")
                  }}
                ]
              });
      });
    };

    var bind = function() {
      var conf = $this.data("config");

      bindRows($("tbody tr", $this));

      $("tfoot .icon-minus", $this).click(function() {
        Msg.confirm(conf.del, function() {
          var $target = $("tbody tr.selected", $this);
          $target.size() && $target.remove();
        });
      });

      $("tfoot .icon-plus", $this).click(function() {
        var $row = $(getRow(conf.columns, {}, conf));
        $("tbody", $this).append($row);
        bindRows($row);
      });

      $("tfoot .icon-up", $this).click(function() {
        var $target = $("tbody tr.selected", $this);

        if ($target.size()) {
          var $rows = $("tbody tr", $this)
            , idx = $rows.index($target);

          idx && $target.after($rows.eq(idx - 1));
        }
      });

      $("tfoot .icon-down", $this).click(function() {
        var $target = $("tbody tr.selected", $this);

        if ($target.size()) {
          var $rows = $("tbody tr", $this)
            , idx = $rows.index($target);

          idx < $rows.size() - 1 && $target.before($rows.eq(idx + 1));
        }
      });

      $(".tips input[type=radio]").click(function() {
        var $radio = $(this)
          , $input = $("tr.selected input[name={0}]".format($radio.attr("name").replace('tip-', '')), $this);

        $input.val($radio.val());
        //close it's parent dialog
        $radio.dialog("close");
      });
    };

    //Get tips inputs
    var getTips = function() {
      for (var key in tips) {
        var id      = 'tip-' + key
          , arr     = tips[key]
          , tipHtml = '';

        tipHtml += '<div id="{0}" class="tips hide">'.format(id);
        tipHtml += '<ul>';
        var arr = tips[key];
        for (var i = 0, l = arr.length; i < l; i++) {
          tipHtml += '<li>';
          tipHtml += '<input type="radio" name="tip-{0}" value="{1}" id="{2}" />'.format(key, arr[i], id + i);
          tipHtml += '<label for="{0}">{1}</label>'.format(id + i, arr[i]);
          tipHtml += '</li>';
        }
        tipHtml += '</ul>';
        tipHtml += '</div>';

        $("#" + id).remove();
        $(document.body).append(tipHtml);
      }
    };

    var getRow = function(columns, row, conf) {
      var trow = "<tr>";

      for (var j = 0, m = columns[0].length; j < m; j++) {
        var column = columns[0][j]
          , format = column.formatter
          , field  = column.field
          , tip    = column.tip
          , value  = row[field];

        typeof value == "undefined" && (value = "");

        if (conf.edit) {
          var maxlength = column.maxlength
            ? 'maxlength="{0}"'.format(column.maxlength)
            : '';

          trow
            = trow + '<td>'
            + '<input name="{0}" value="{1}" class="{2}" {3}/>'.format(column.field, value, tip ? "hastip" : "", maxlength)
            + (tip ? '<a data-field="{0}" class="icon-info tip"></a>'.format(field) : "")
            + '</td>';

          if (tip) {
            //allow user select empty string.
            !tips[field] && (tips[field] = ['&nbsp;']);
            value.toString().trim() != ""
              && tips[field].indexOf(value) < 0
              && tips[field].push(value);
          }

        } else {
          value = format ? format(value, row) : value;
          trow = trow + "<td>" + value + "</td>";
        }
      };
      trow += "</tr>";
      return trow;
    };

    var getData = function(edit) {
      if (!options) return;

      var config  = $this.data("config") || {}
        , columns = config.columns
        , rows    = options.rows || options;

      var body = "<tbody>";
      if (rows) {
        for (var i = 0, l = rows.length; i < l; i++) {
          body += getRow(columns, rows[i], config);
        };
      }
      body += "</tbody>";
      if (config.add || config.del) {
        body += '<tfoot><tr><td colspan="{0}" class="toolbar">'.format(columns[0].length);

        config.add  && (body += '<a class="icon-plus">'  + config.add + '</a>');
        config.del  && (body += '<a class="icon-minus">' + config.del + '</a>');
        config.up   && (body += '<a class="icon-up">'   + config.up   + '</a>');
        config.down && (body += '<a class="icon-down">' + config.down + '</a>');

        body += '</td></tr></tfoot>';
      }

      $("tbody", $this).remove();
      $this
        .data("rows", rows)
        .append(body);

      getTips();

      //add "edit" class if it's edit mode.
      config.edit && $this.addClass("edit");
      //rebind events
      bind();
    };

    //handle: $().datagrid({column: [[]]})
    if (method.constructor == Object) {
      var columns = method.columns;
 
      if (columns) {
        $("thead", $this).size() < 1
          && $this.append("<thead></thead>");

        var header = "<tr>";
        //method.del && (header += "<td></td>");
        for (var i = 0, l = columns[0].length; i < l; i++) {
          var col = columns[0][i];
          header += '<th>' + (col.title || "") + '</th>';
        }
        header += "</tr>";

        $this
          //.removeClass("c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12")
          //.addClass("c" + l)
          .addClass("data")
          .data("config",  method)
          .data("onSelect", method.onSelect);

        $("thead", $this).html(header);
      }
    }

    //handle: $().datagrid("loadData", {rows: []}) or $().data("loadData", [])
    if (method == "loadData") getData();

    if (method == "getColumnFields") {
      return $this.data("columns");
    }

    if (method == "unselectRow") {
      $("tbody tr", $this).eq(options).removeClass("selected");
    }

    if (method == "updateRow") {
      var idx     = options.index
        , row     = options.row
        , columns = $this.data("columns")
        , rows    = $this.data("rows");

      if (rows) {
        row = $.extend(rows[idx], row);
        $this.data("rows", rows);
      }

      var $row = $(getRow(columns, row));

      $("tbody tr", $this).eq(idx)
        .after($row)
        .remove();

      bindRows($row);
    }

    if (method == "getSelections") {
      var rows    = $this.data("rows")
        , selRows = [];

      $("tbody tr", $this).each(function(idx) {
        $(this).hasClass("selected") && selRows.push(rows[idx]);
      });

      return selRows;
    }

    return $this;
  };

})(jQuery);