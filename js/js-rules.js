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
        var $input = this.$el.find("input");
        var input = $input[0];

        var type = this.getType();

        if (type === "boolean") {
            val = (val === "true");
        } else if (type === "number") {
            val = parseFloat(val) || 0;
        }

        var newVal = val.toString();

        if (newVal !== input.value) {
            input.value = newVal;
        }

        this.match.vars.value = val;
        $input.width(JSRules.textWidth(newVal) - 4);

        this.triggerUpdate();
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
        this.$el.data("value", val);
        return this;
    }
}));