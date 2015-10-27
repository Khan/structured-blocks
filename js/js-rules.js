var JSProgram = JSRules.addRule(JSRule.extend({
    structure: {type: "Program"},

    className: "program",

    triggerUpdate: function() {
        // Prevent many updates from spamming updated events
        if (this.updateDelay) {
            return;
        }

        this.updateDelay = setTimeout(function() {
            this.updateDelay = null;
            this.trigger("updated");
        }.bind(this), 0);
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

    defaultValue: i18n._("Your comment..."),

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

        var value = event.target.value || this.defaultValue;

        $(event.target).width(Math.max(JSRules.textWidth(value) - 3, 40));

        this.triggerUpdate();
    },

    render: function() {
        var value = this.match._[0].replace(/^\s*/, "");

        this.$el.html($("<div>").addClass("block-wrapper").html([
            "<span class='grab-handle'><span class='grabber'></span>" +
            "<span class='show-toolbox comment'>//&nbsp;" +
            "<span class='show-only-toolbox'>Comment</span></span></span>",
            $("<input>").attr({
                type: "text",
                value: value,
                placeholder: this.defaultValue,
                "class": "comment input"
            }).width(Math.max(
                JSRules.textWidth(value || this.defaultValue) + 4, 40))
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

        $(event.target).width(
            Math.max(JSRules.textWidth(event.target.value) - 2, 40));

        this.triggerUpdate();
    },

    render: function() {
        var name = this.match.vars.name.toString();

        this.$el.html($("<input>")
            .width(Math.max(JSRules.textWidth(name), 40))
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
        "input input": "onInput",
        "keydown input": "onKeyDown",
        "updateValue": "updateValue"
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
        var value = this.match.vars.value;

        // Negative numbers are handled with a different expression
        if (this.getType() === "number" && value < 0) {
            return {
                type: "UnaryExpression",
                operator: "-",
                prefix: true,
                argument: {
                    type: "Literal",
                    value: Math.abs(value)
                }
            };
        }

        return {
            type: "Literal",
            value: value
        };
    },

    getValue: function() {
        return this.match.vars.value;
    },

    setValue: function(val) {
        var type = this.getType();

        if (type === "boolean") {
            val = (val === "true");
        } else if (type === "number") {
            val = parseFloat(val) || 0;
        }

        var newVal = val.toString();

        if (newVal !== this.getInputValue()) {
            this.setInputValue(newVal);
        }

        this.match.vars.value = val;
        this.getInput().width(Math.max(JSRules.textWidth(newVal) - 2, 40));
        this.$el.data("value", val);

        this.triggerUpdate();
    },

    getInput: function() {
        return this.$el.find(".input");
    },

    getInputValue: function() {
        var $input = this.getInput();

        return $input.is("input") ?
            $input.val() :
            $input.text();
    },

    setInputValue: function(val) {
        var $input = this.getInput();

        if ($input.is("input")) {
            $input.val(val);
        } else {
            $input.text(val);
        }
    },

    updateValue: function(e, val) {
        this.setValue(val);
    },

    onInput: function(e) {
        this.setValue(e.target.value);
    },

    onKeyDown: function(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            this.deactivate();
        }
    },

    render: function() {
        var type = this.getType();
        var val = this.match.vars.value.toString();

        this.$el.addClass("block-" + type);

        var $input = $("<input>").attr({
            type: "text",
            value: val
        });

        if (JSRules.isTouchDevice) {
            $input = $("<span>").text(val);
        }

        $input.width(Math.max(JSRules.textWidth(val), 40))
            .addClass("input constant numeric");

        this.$el.html($input);
        this.$el.data("value", val);

        return this;
    }
}));
