var JSEditor = Backbone.View.extend({
    className: "editor",

    initialize: function(options) {
        var code = options.code;

        if (typeof code === "string") {
            code = JSRules.parseProgram(code);
        }

        this.code = code;

        this.code.on({
            "updated": function() {
                this.trigger("updated", code);
            }.bind(this)
        });

        setTimeout(function() {
            this.trigger("updated", code);
        }.bind(this), 0);
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

        this.editor.on("updated", function(code) {
            this.trigger("updated", code);
        }.bind(this));

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

var JSRules = {
    rules: [],

    findRule: function(node) {
        if (typeof node !== "object") {
            return;
        }

        for (var r = 0; r < this.rules.length; r++) {
            var Rule = this.rules[r];
            var match = Structured.matchNode(node, Rule.prototype.structure);

            if (match) {
                return new Rule({
                    node: node,
                    match: match,
                    structure: Rule.prototype.structure
                });
            }
        }

        throw new Error("No rule found for: " + JSON.stringify(node));
    },

    addRule: function(rule) {
        if (typeof rule.prototype.structure === "function") {
            rule.prototype.structure =
                this.parseStructure(rule.prototype.structure);
        }
        this.rules.push(rule);
        return rule;
    },

    parseProgram: function(code) {
        return new JSProgram({
            node: esprima.parse(code)
        });
    },

    parseStructure: function(fn) {
        return esprima.parse("(" + fn + ")").body[0].expression.body.body[0];
    }
};

var JSStatements = Backbone.Collection.extend({
    initialize: function() {
        this.on("sort-update", function(model, index) {
            // Ignore cases where the model isn't in this collection
            if (this.indexOf(model) < 0) {
                return;
            }

            this.remove(model);
            this.add(model, {at: index});
        });
    },

    model: function(attrs) {
        // Ignore objects that are already a JSRule model
        if (attrs instanceof JSRule) {
            return attrs;
        }

        return JSRules.findRule(attrs);
    }
});

var JSRule = Backbone.View.extend({
    events: {
        "sort-update": "sortUpdate",
    },

    initialize: function(options) {
        this.node = options.node;
        this.structure = options.structure;
        this.match = _.defaults(this.genMatch(options), {
            _: [],
            vars: {}
        });
        this.children = this.getChildModels();
    },

    sortUpdate: function(e, index) {
        if (this.collection) {
            this.collection.trigger("sort-update", this, index);
        }

        this.updated();
    },

    updated: function() {
        this.trigger("updated");
    },

    getChildModels: function(state) {
        state = state || this.match;
        var ret = {_: [], vars: {}};

        for (var i = 0; i < state._.length; i++) {
            var match = state._[i];
            ret._[i] = _.isArray(match) ?
                this.modelMatchArray(match) :
                this.modelMatch(match);
        }

        for (var name in state.vars) {
            var match = state.vars[name];
            ret.vars[name] = _.isArray(match) ?
                this.modelMatchArray(match) :
                this.modelMatch(match);
        }

        return ret;
    },

    modelMatch: function(match) {
        return JSRules.findRule(match);
    },

    modelMatchArray: function(matches) {
        return new JSStatements(matches);
    },

    genMatch: function() {
        throw new Error("No genMatch method implemented.");
    },

    toAST: function() {
        throw new Error("No toAST method implemented.");
    },

    toScript: function() {
        return escodegen.generate(this.toAST());
    },

    getAST: function() {
        var state = this.match;
        var ret = {_: [], vars: {}};

        for (var i = 0; i < state._.length; i++) {
            var match = state._[i];
            ret._[i] = _.isArray(match) ?
                this.astComponentArray(match, "_", i) :
                this.astComponent(match, "_", i);
        }

        for (var name in state.vars) {
            var match = state.vars[name];
            ret.vars[name] = _.isArray(match) ?
                this.astComponentArray(match, "vars", name) :
                this.astComponent(match, "vars", name);
        }

        return ret;
    },

    astComponent: function(match, ns, id) {
        return this.children[ns][id].toAST();
    },

    astComponentArray: function(matches, ns, id) {
        return matches.map(function(match, i) {
            return this.children[ns][id].at(i).toAST();
        }.bind(this));
    },

    renderStatements: function(collection) {
        var $div = $("<div>").addClass("block block-statements");

        $div.html(collection.map(function(statement) {
            return statement.render().el;
        }));

        $div.sortable({
            revert: true,
            change: function(e, ui) {
                var curPos = ui.placeholder.parent().children(
                    ":not(.ui-sortable-helper)")
                    .index(ui.placeholder);
                ui.item.trigger("sort-update", curPos);
            }
        });

        return $div[0];
    },

    renderInput: function(statement) {
        // TODO: Handle the input type
        var $div = $("<div>").addClass("block block-input");
        $div.html(statement.render().el);
        return $div[0];
    }
});

var JSASTRule = JSRule.extend({
    genMatch: function(options) {
        return options.match;
    },

    toAST: function() {
        return Structured.injectData(this.structure, this.getAST());
    }
});