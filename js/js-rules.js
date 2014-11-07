var JSProgram = JSRules.addRule(JSRule.extend({
    structure: {type: "Program"},

    additionalEvents: {
        "updated": "updated"
    },

    className: "program",

    updated: function() {
        this.trigger("updated", this.getAST());
    },

    genMatch: function() {
        return {
            _: [this.node.body]
        };
    },

    toAST: function() {
        return {
            type: "Program",
            body: this.getAST()._[0]
        };
    },

    render: function() {
        this.$el.html(this.renderStatements(this.children._[0]));
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

        this.triggerUpdate();
    },

    render: function() {
        var name = this.match.vars.name.toString();

        this.$el.html($("<input>")
            .attr({
                type: "text",
                value: name,
                size: name.length
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

    onInput: function(event) {
        var val = event.target.value;
        var type = this.getType();

        if (type === "boolean") {
            val = (val === "true");
        } else if (type === "number") {
            val = parseFloat(val);
        }

        this.match.vars.value = val;

        this.triggerUpdate();
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
            .attr({
                type: "text",
                value: val,
                size: val.length,
                "class": "constant numeric"
            }));
        return this;
    }
}));