var JSEditor = Backbone.View.extend({
    className: "editor",

    initialize: function(options) {
        var code = options.code;

        if (typeof code === "string") {
            code = JSRules.parseProgram(code);
        }

        this.code = code;
    },

    render: function() {
        this.$el.html(this.code.render().$el);
        return this;
    }
});

var JSToolbox = Backbone.View.extend({
    className: "toolbox",

    initialize: function(options) {
        var toolbox = options.toolbox || [];

        toolbox = toolbox.map(function(item) {
            if (typeof item === "function") {
                item = JSRules.parseStructure(item);
            }

            return JSRules.findRule(item);
        });

        this.toolbox = toolbox;
    },

    render: function() {
        this.$el.html(this.toolbox.map(function(item) {
            return item.render().$el;
        }));
        return this;
    }
});

var JSToolboxEditor = Backbone.View.extend({
    initialize: function(options) {
        this.editor = new JSEditor({
            code: options.code
        });

        this.toolbox = new JSToolbox({
            toolbox: options.toolbox
        });

        this.render();
    },

    render: function() {
        this.$el.html([
            this.editor.render().$el,
            this.toolbox.render().$el
        ]);
    }
});

// TODO: Generate blocks for statements from AST automatically

// TODO: Generate AST/Code

// TODO: Sync position of element immediately on initial drag in

// TODO: Destroy To drag on leave drop
// TODO: Find a way to drag sub-components
//  - Be able to move a sub-component into another blank
//    - Limit it by the "type" and the accepted type
//  - Be able to "destroy" an existing sub-component - some how?

// TODO: Find a way to dynamically manage variables in the toolbox

$(function() {
    var toolbox = [
        function() {
            var name = true;
        },
        function() {
            var foo = false;
        },
        function() {
            ellipse(20, 20, 100, 100);
        },
        {"type": "Literal", "value": 10},
        {"type": "Literal", "value": true}
    ];

    var code = "var a = true;\nellipse(10, 20, 30, 40);";

    window.toolboxEditor = new JSToolboxEditor({
        el: $("#structured-blocks"),
        toolbox: toolbox,
        code: code
    });

    setInterval(function() {
        $("#output").val(toolboxEditor.editor.code.toScript());
    }, 100);
});