var JSProgram = JSRules.addRule(JSRule.extend({
    structure: {type: "Program"},

    className: "program",

    updated: function() {
        this.trigger("updated");
    },

    genMatch: function() {
        var leadingComments = this.node.leadingComments || [];
        return {
            _: [leadingComments.concat(this.node.body)]
        };
    },

    toAST: function() {
        var ast = this.getAST();
        return {
            type: "Program",
            leadingComments: ast.leadingComments,
            body: ast._[0]
        };
    },

    render: function() {
        this.$el.html(this.renderStatements(this.children._[0]));
        return this;
    }
}));

var JSComment = JSRules.addRule(JSRule.extend({
    structure: {type: "Line"},

    className: "block block-statement block-comment",

    additionalEvents: {
        "input input": "onInput"
    },

    isComment: function() {
        return true;
    },

    genMatch: function() {
        return {
            _: [this.node.value]
        };
    },

    toAST: function() {
        return {
            type: "Line",
            value: this.match._[0].replace(/^\s*/, " ")
        };
    },

    onInput: function(event) {
        this.match._[0] = event.target.value;

        $(event.target).width(JSRules.textWidth(event.target.value) - 8);

        this.triggerUpdate();
    },

    render: function() {
        var value = this.match._[0].replace(/^\s*/, "");

        this.$el.html($("<div>").html([
            "<span class='show-toolbox comment'>//&nbsp;" +
            "<span class='show-only-toolbox'>Comment</span></span>",
            $("<input>").attr({
                type: "text",
                value: value,
                "class": "comment"
            }).width(JSRules.textWidth(value))
        ]));
        return this;
    }
}));

JSRules.addRule(JSASTRule.extend({
    structure: function() {
        var _ = _;
    }
}));

JSRules.addRule(JSRule.extend({
    structure: {type: "Identifier"},

    className: "block block-inline block-variable",

    additionalEvents: {
        "input input": "onInput"
    },

    genMatch: function() {
        return {
            vars: {
                name: this.node.name
            }
        };
    },

    toAST: function() {
        return {
            type: "Identifier",
            name: this.match.vars.name
        };
    },

    onInput: function(event) {
        this.match.vars.name = event.target.value;

        $(event.target).width(JSRules.textWidth(event.target.value) - 4);

        this.triggerUpdate();
    },

    render: function() {
        var name = this.match.vars.name.toString();

        this.$el.html($("<input>")
            .width(JSRules.textWidth(name))
            .attr({
                type: "text",
                value: name
            }));
        return this;
    }
}));

JSRules.addRule(JSRule.extend({
    structure: {type: "Literal"},

    className: "block block-inline",

    additionalEvents: {
        "click": "activate",
        "input input": "onInput",
        "blur input": "deactivate",
        "keydown input": "onKeyDown"
    },

    getType: function() {
        return typeof this.node.value;
    },

    genMatch: function() {
        return {
            vars: {
                value: this.node.value
            }
        };
    },

    toAST: function() {
        return {
            type: "Literal",
            value: this.match.vars.value
        };
    },

    getValue: function() {
        return this.match.vars.value;
    },

    setValue: function(val) {
        var origVal = val;
        var type = this.getType();

        if (type === "boolean") {
            val = (val === "true");
        } else if (type === "number") {
            val = parseFloat(val) || 0;
        }

        var newVal = val.toString();
        var $input = this.$el.find("input");
        var input = $input[0];

        if (newVal !== origVal) {
            input.value = newVal;
        }

        this.match.vars.value = val;
        $input.width(JSRules.textWidth(newVal) - 4);

        this.triggerUpdate();
    },

    onInput: function(event) {
        this.setValue(event.target.value);
    },

    onKeyDown: function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            this.deactivate();
        }
    },

    deactivate: function() {
        this.active = false;
    },

    activate: function() {
        if (this.editable) {
            this.active = true;
            var input = this.$el.find("input")[0];
            input.focus();
            input.select();
        }
    },

    render: function() {
        var type = this.getType();
        var val = this.match.vars.value.toString();

        this.$el.addClass("block-" + type);
        this.$el.html($("<input>")
            .width(JSRules.textWidth(val))
            .attr({
                type: "text",
                value: val,
                "class": "constant numeric"
            }));
        return this;
    }
}));