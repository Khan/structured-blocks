var JSRules = {
    rules: [],
    key: 0,

    addRule: function(rule) {
        rule = React.createClass(rule);
        this.rules.push(rule);
        return rule;
    },

    parseProgram: function(code) {
        return React.createElement(JSRule, {node: esprima.parse(code)});
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
        return React.createElement(JSRule, {ref: ns + id, node: match});
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
        var node = this.props.node;

        if (typeof node !== "object") {
            return;
        }

        for (var r = 0; r < JSRules.rules.length; r++) {
            var rule = JSRules.rules[r];
            var match = Structured.matchNode(node, rule.structure);

            if (match) {
                JSRules.keys += 1;

                return React.createFactory(rule)({
                    node: node,
                    match: match,
                    structure: rule.structure,
                    key: JSRules.key,
                    ref: "child"
                });
            }
        }

        throw new Error("No rule found for: " + JSON.stringify(node));
    }
});

var JSProgram = JSRules.addRule({
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: {type: "Program"}
    },

    getType: function() {
        return "program";
    },

    genMatch: function(node) {
        return {
            _: [this.props.node.body]
        };
    },

    toAST: function() {
        var ast = this.getAST();
        return {
            type: "Program",
            body: ast._[0]
        };
    },

    render: function() {
        var children = this.getChildComponents();
        return React.createElement("div", {className: "program"}, 
            React.createElement(BlankStatements, null, children._)
        );
    }
});

var JSVarAssignment = JSRules.addRule({
    mixins: [BlockMixin, JSMixin, JSASTMixin],

    statics: {
        structure: JSRules.parseStructure(function() {
            var _ = _;
        })
    },

    getType: function(match) {
        return "statement";
    },

    render: function() {
        var children = this.getChildComponents();
        return React.createElement("div", {className: "block block-statement"}, 
            'var ', children._[0], 
            ' = ', React.createElement(BlankInput, null, children._[1]), ';'
        );
    }
});

var JSIdentifier = JSRules.addRule({
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: {type: "Identifier"}
    },

    getType: function() {
        return "variable";
    },

    genMatch: function() {
        return {
            vars: {
                name: this.props.node.name
            }
        };
    },

    toAST: function() {
        return {
            type: "Identifier",
            name: this.state.vars.name
        };
    },

    onChange: function(event) {
        this.setState({vars: {name: event.target.value}});
    },

    render: function() {
        return React.createElement("div", {className: "block block-inline"}, 
            React.createElement("input", {type: "text", defaultValue: this.state.vars.name, 
                onChange: this.onChange})
        );
    }
});

var JSLiteral = JSRules.addRule({
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: {type: "Literal"}
    },

    getType: function() {
        return typeof this.props.node.value;
    },

    genMatch: function() {
        return {
            vars: {
                value: this.props.node.value
            }
        };
    },

    toAST: function() {
        return {
            type: "Literal",
            value: this.state.vars.value
        };
    },

    onChange: function(event) {
        var val = event.target.value;
        var type = this.getType();

        if (type === "boolean") {
            val = (val === "true");
        } else if (type === "number") {
            val = parseFloat(val);
        }

        this.setState({vars: {value: val}});
    },

    render: function() {
        return React.createElement("div", {className: "block block-inline"}, 
            React.createElement("input", {type: "text", defaultValue: this.state.vars.value, 
                onChange: this.onChange})
        );
    }
});