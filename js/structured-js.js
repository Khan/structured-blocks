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

var JSRule = Backbone.View.extend({
    initialize: function(options) {
        this.node = options.node;
        this.structure = options.structure;
        this.match = _.defaults(this.genMatch(options), {
            _: [],
            vars: {}
        });
        this.children = this.getChildModels();
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
        return matches.map(function(match) {
            return this.modelMatch(match);
        }.bind(this));
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
            return this.children[ns][id][i].toAST();
        }.bind(this));
    },

    renderStatements: function(statements) {
        var $div = $("<div>").addClass("block block-statements");

        $div.html(statements.map(function(statement) {
            return statement.render().$el;
        }));

        return $div[0];
    },

    renderInput: function(statement) {
        // TODO: Handle the input type
        var $div = $("<div>").addClass("block block-input");
        $div.html(statement.render().$el);
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