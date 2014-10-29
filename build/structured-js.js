var JSRules = {
    rules: [],

    addRule: function(rule) {
        rule = React.createClass(rule);
        this.rules.push(rule);
        return rule;
    },

    parseProgram: function(code) {
        return esprima.parse(code).body;
    },

    parseStructure: function(fn) {
        return esprima.parse("(" + fn + ")").body[0].expression.body.body[0];
    }
};

var JSMixin = {
    getInitialState: function() {
        var match = this.props.match;

        if (this.genMatch) {
            match = this.genMatch(match);
        }

        match._ = match._ || [];
        match.vars = match.vars || {};

        return match;
    },

    getChildComponents: function(state) {
        state = state || this.state;
        var ret = {_: [], vars: {}};

        for (var i = 0; i < state._.length; i++) {
            var match = state._[i];
            ret._[i] = _.isArray(match) ?
                this.componentMatchArray(match, "_", i) :
                this.componentMatch(match, "_", i);
        }

        for (var name in state.vars) {
            var match = state.vars[name];
            ret.vars[name] = _.isArray(match) ?
                this.componentMatchArray(match, "vars", name) :
                this.componentMatch(match, "vars", name);
        }

        return ret;
    },

    componentMatch: function(match, ns, id) {
        return React.createElement(JSRule, {ref: ns + id, data: match});
    },

    componentMatchArray: function(matches, ns, id) {
        return matches.map(function(match, i) {
            return this.componentMatch(match, ns, id + "-" + i);
        }.bind(this));
    },

    getAST: function() {
        var state = this.state;
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
        return this.refs[ns + id].toAST();
    },

    astComponentArray: function(matches, ns, id) {
        return matches.map(function(match, i) {
            return this.astComponent(match, ns, id + "-" + i);
        }.bind(this));
    }
};

var JSASTMixin = {
    toAST: function() {
        return Structured.injectData(this.props.structure, this.getAST());
    }
};

var JSRule = React.createClass({displayName: 'JSRule',
    toAST: function() {
        return this.refs.child.toAST();
    },

    toScript: function() {
        return escodegen.generate(this.toAST());
    },

    render: function() {
        var node = this.props.data;

        if (typeof node !== "object") {
            return;
        }

        for (var r = 0; r < JSRules.rules.length; r++) {
            var rule = JSRules.rules[r];
            var match = Structured.matchNode(node, rule.structure);

            if (match) {
                return React.createFactory(rule)({
                    node: node,
                    match: match,
                    structure: rule.structure,
                    ref: "child",
                    draggable: true
                });
            }
        }

        throw new Error("No rule found for: " + JSON.stringify(node));
    }
});