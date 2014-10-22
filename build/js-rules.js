var JSRules = {
    rules: [],

    key: 1,

    addRule: function(rule) {
        this.rules.push(rule);
    },

    parseProgram: function(code) {
        var ast = esprima.parse(code);
        return this.findRule(ast);
    },

    findRule: function(node) {
        if (typeof node !== "object") {
            return;
        }

        for (var r = 0; r < this.rules.length; r++) {
            var rule = this.rules[r];
            var match = Structured.matchNode(node, rule.structure);

            if (match) {
                return React.createFactory(rule)({
                    node: match.root || node,
                    match: match,
                    key: this.key++
                });
            }
        }

        throw new Error("No rule found for: " + JSON.stringify(node));
    },

    toAST: function(fn) {
        return esprima.parse("(" + fn + ")").body[0].expression.body.body[0];
    }
};

var JSMixin = {
    getInitialState: function() {
        var match = this.props.match;

        if (this.genMatch) {
            match = this.genMatch(match);
        }

        // Convert matched nodes into React components
        this.convertMatchToComponents(match);

        return {
            _: match._ || [],
            vars: match.vars || {}
        };
    },

    // TODO: Make this generic so that we can use this
    // recursion for other areas, as well.
    convertMatchToComponents: function(match) {
        if (match._) {
            for (var i = 0; i < match._.length; i++) {
                var singleMatch = match._[i];
                if (_.isArray(singleMatch)) {
                    this.handleMatchArray(singleMatch);
                } else {
                    this.handleMatch(singleMatch, match._, i);
                }
            }
        }

        if (match.vars) {
            for (var name in match.vars) {
                var singleMatch = match.vars[name];
                if (_.isArray(singleMatch)) {
                    this.handleMatchArray(singleMatch);
                } else {
                    this.handleMatch(singleMatch, match._, i);
                }
            }
        }
    },

    handleMatch: function(match, obj, name) {
        var rule = JSRules.findRule(match);
        if (rule) {
            obj[name] = JSRules.findRule(match);
        }
    },

    handleMatchArray: function(matches) {
        for (var i = 0; i < matches.length; i++) {
            this.handleMatch(matches[i], matches, i);
        }
    },

    toAST: function() {
        // find all _/glob_ and $../glob$.. tokens and
        // recurse through and get the toAST of them, as well
        // Check if rule has a toAST() and call that instead
    },

    toScript: function() {
        return escodegen.generate(this.toAST());
    },
};

var JSProgram = React.createClass({displayName: 'JSProgram',
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: {type: "Program"}
    },

    getType: function() {
        return "program";
    },

    genMatch: function(node) {
        return {
            _: this.props.node.body
        };
    },

    render: function() {
        return React.createElement("div", {className: "program"}, 
            React.createElement(BlankStatements, null, this.state._[0])
        );
    }
});

JSRules.addRule(JSProgram);

var JSVarAssignment = React.createClass({displayName: 'JSVarAssignment',
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: JSRules.toAST(function() {
            var _ = _;
        })
    },

    getType: function(match) {
        return "statement";
    },

    render: function() {
        return React.createElement("div", {className: "block block-statement"}, 
            'var ', this.state._[0], 
            ' = ', React.createElement(BlankInput, null, this.state._[1]), ';'
        );
    }
});

JSRules.addRule(JSVarAssignment);

var JSIdentifier = React.createClass({displayName: 'JSIdentifier',
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: {type: "Identifier"}
    },

    getType: function() {
        return "variable";
    },

    genMatch: function() {
        return {
            _: [this.props.node.name]
        };
    },

    render: function() {
        return React.createElement("div", {className: "block block-inline"}, 
            React.createElement("input", {type: "text", defaultValue: this.state._[0]})
        );
    }
});

JSRules.addRule(JSIdentifier);

var JSLiteral = React.createClass({displayName: 'JSLiteral',
    mixins: [BlockMixin, JSMixin],

    statics: {
        structure: {type: "Literal"}
    },

    getType: function() {
        return typeof this.props.node.value;
    },

    genMatch: function() {
        return {
            _: [this.props.node.value]
        };
    },

    render: function() {
        return React.createElement("div", {className: "block block-inline"}, 
            React.createElement("input", {type: "text", defaultValue: this.state._[0]})
        );
    }
});

JSRules.addRule(JSLiteral);