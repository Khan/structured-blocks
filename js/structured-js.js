var JSEditor = Backbone.View.extend({
    className: "block-editor",

    initialize: function(options) {
        this.setCode(options.code);
    },

    setCode: function(code) {
        if (typeof code === "string") {
            code = JSRules.parseProgram(code);
        }

        this.code = code;

        this.code.on({
            "updated": function() {
                this.trigger("updated");
            }.bind(this)
        });
    },

    toScript: function() {
        return this.code.toScript();
    },

    render: function() {
        this.$el.html(this.code.render().$el);
        return this;
    }
});

var JSToolbox = Backbone.View.extend({
    className: "block-toolbox",

    initialize: function(options) {
        var toolbox = options.toolbox || {};

        _.keys(toolbox).forEach(function(category) {
            toolbox[category] = toolbox[category].map(function(item) {
                if (typeof item === "function") {
                    item = JSRules.parseStructure(item);
                }

                var rule = JSRules.findRule(item);
                rule.imagesDir = options.imagesDir;

                return rule;
            });
        });

        this.toolbox = toolbox;
    },

    render: function() {
        var html = [];
        var toolbox = this.toolbox;

        _.keys(toolbox).forEach(function(category) {
            html.push("<h3>" + category + "</h3>");

            toolbox[category].forEach(function(item) {
                var $item = item.render().$el;

                $item.data("drag-data", item.toAST());

                $item.draggable({
                    connectToSortable: ".block-statements",
                    helper: function() {
                        return $item.clone(true);
                    },
                    revert: "invalid"
                });

                html.push($item);
            });
        });

        this.$el.html(html);

        return this;
    }
});

var JSToolboxEditor = Backbone.View.extend({
    initialize: function(options) {
        this.imagesDir = options.imagesDir;

        this.editor = new JSEditor({
            code: options.code
        });

        this.editor.on("updated", function(code) {
            this.trigger("updated", code);
        }.bind(this));

        this.toolbox = new JSToolbox({
            toolbox: options.toolbox,
            imagesDir: options.imagesDir
        });

        this.render();
    },

    setCode: function(code) {
        this.editor.setCode(code);
        this.editor.render();
    },

    toScript: function() {
        return this.editor.toScript();
    },

    codeToHTML: function(code) {
        if (typeof code === "function") {
            code = JSRules.parseStructure(code);
        } else if (typeof code === "string") {
            // Remove any sort of wrapper function
            code = code.replace(/^function\s*\(\s*\)\s*{([\s\S]*)}$/, "$1");
            code = esprima.parse(code).body[0];
        }

        var rule = JSRules.findRule(code);
        var $el = rule.render().$el;

        // Remove all the inputs and replace them with just the text
        $el.find("input").each(function() {
            $(this).replaceWith($("<span>")
                .text(this.value)
                .addClass("input " + this.className));
        });

        return $el[0].outerHTML;
    },

    render: function() {
        this.$el.children().detach();
        this.$el.append([
            this.editor.render().$el,
            this.toolbox.render().$el
        ]);
    }
});

var JSRules = {
    rules: [],

    findRule: function(node, parent) {
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
                    parent: parent
                });
            }
        }

        throw new Error("No rule found for: " + JSON.stringify(node));
    },

    addRule: function(rule) {
        rule.prototype.tokens = this.tokenize(rule.prototype.structure);

        if (typeof rule.prototype.structure === "function") {
            rule.prototype.structure =
                this.parseStructure(rule.prototype.structure);
        }

        this.rules.push(rule);
        return rule;
    },

    tokenize: function(fn) {
        if (typeof fn === "object") {
            return [];
        }

        if (typeof fn === "function") {
            fn = fn.toString().replace(/function.*?{\s*/, "")
                .replace(/\s*}$/, "");
        }

        return esprima.tokenize(fn);
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
    // For Backbone 1.0.0+
    _prepareModel: function(attrs, options) {
        // Ignore objects that are already a JSRule model
        if (attrs instanceof JSRule) {
            attrs.collection = this;
            return attrs;
        }

        var model = JSRules.findRule(attrs, options.parent);
        model.collection = this;
        return model;
    }
});

var JSRule = Backbone.View.extend({
    baseEvents: {
        "sort-update": "sortUpdate",
        "sort-added": "sortAdded",
        "sort-removed": "sortRemoved",
        "inside": "inside",
        "outside": "outside",
        "drop": "drop"
    },

    events: function() {
        return _.extend({}, this.baseEvents, this.additionalEvents);
    },

    initialize: function(options) {
        this.node = options.node;
        this.match = _.defaults(this.genMatch(options), {
            _: [],
            vars: {}
        });
        this.children = this.getChildModels();
        this.parent = options.parent;
    },

    inside: function() {
        this.$el.removeClass("outside");
    },

    outside: function() {
        this.$el.addClass("outside");
    },

    drop: function() {
        // Ignore the cases where this isn't a new draggable coming in
        if (!this.$el.hasClass("ui-draggable")) {
            return;
        }

        // Remove the draggable related classes/styling
        this.$el.removeClass("ui-draggable ui-draggable-handle")
            .css({width: "", height: ""});

        // Re-render after dropping the element, to avoid any dummy
        // element shenanigans from jQuery UI
        this.render();

        this.$el.parent().sortable("refresh");
    },

    sortUpdate: function(e, index) {
        var collection = this.collection;

        if (this.collection) {
            // Ignore cases where the model isn't in this collection
            if (collection.models.indexOf(this) < 0) {
                return;
            }

            collection.remove(this);
            collection.add(this, {at: index});
        }

        this.triggerUpdate();
    },

    sortAdded: function(e, data, index, elem) {
        var collection = this.findChildCollection();

        if (collection) {
            var newModel = JSRules.findRule(data, this);
            newModel.setElement(elem);
            collection.add(newModel, {at: index});
        }

        this.triggerUpdate();
    },

    sortRemoved: function(e, index) {
        var collection = this.findChildCollection();

        if (collection) {
            var model = collection.at(index);
            collection.remove(model);
        }

        this.triggerUpdate();
    },

    triggerUpdate: function() {
        this.trigger("updated");

        if (this.parent) {
            this.parent.triggerUpdate();
        }
    },

    findChildCollection: function() {
        // TODO: Eventually support multiple collections per model
        var children = this.children;

        for (var i = 0, l = children._.length; i < l; i++) {
            if (children._[i] instanceof JSStatements) {
                return children._[i]
            }
        }

        for (var name in children.vars) {
            if (children.vars[name] instanceof JSStatements) {
                return children.vars[name];
            }
        }
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
        return JSRules.findRule(match, this);
    },

    modelMatchArray: function(matches) {
        return new JSStatements(matches, {
            parent: this
        });
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
        return this.children[ns][id].map(function(model) {
            return model.toAST();
        });
    },

    renderStatements: function(collection) {
        var $div = $("<div>").addClass("block block-statements");

        $div.html(collection.map(function(statement) {
            return statement.render().el;
        }));

        var getIndex = function(ui) {
            if (ui.helper) {
                return ui.placeholder.parent().children()
                    .not(".ui-sortable-helper")
                    .not(ui.item)
                    .index(ui.placeholder);
            } else {
                return ui.item.index();
            }
        };

        var outside = false;
        var stopping = false;
        var over = false;

        $div.sortable({
            revert: false,
            change: function(e, ui) {
                ui.item.trigger("sort-update", getIndex(ui));
            },
            receive: function(e, ui) {
                if (outside) {
                    ui.item.triggerHandler("inside");
                }
                over = false;
                outside = false;
            },
            over: function(e, ui) {
                if (over) {
                    return;
                }

                if (ui.helper.hasClass("ui-draggable")) {
                    var data = ui.helper.data("drag-data");
                    ui.placeholder.trigger("sort-added",
                        [data, getIndex(ui), ui.item]);
                }

                over = true;
                outside = false;
                ui.item.triggerHandler("inside");
                ui.placeholder.removeClass("outside");
            },
            beforeStop: function(e, ui) {
                stopping = true;

                // Remove item when dropped outside the sortable
                if (outside) {
                    ui.item.trigger("sort-removed", getIndex(ui));
                    ui.item.remove();
                }
            },
            stop: function(e, ui) {
                over = false;
                stopping = false;
                ui.item.triggerHandler("drop");
            },
            out: function(e, ui) {
                // An extra 'out' event fires while stopping, we ignore it
                if (stopping) {
                    return;
                }

                over = false;
                outside = true;

                // Remove the model when the external draggable is moved
                // outside of the sortable (sortable already removes the elem)
                if (ui.helper && ui.helper.hasClass("ui-draggable")) {
                    ui.item.trigger("sort-removed", getIndex(ui));
                }

                ui.placeholder.addClass("outside");
                ui.item.triggerHandler("outside");
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
    className: "block block-statement",

    genMatch: function(options) {
        return options.match;
    },

    toAST: function() {
        return Structured.injectData(this.structure, this.getAST());
    },

    render: function() {
        var children = this.children;
        var tokens = this.tokens;
        var _pos = 0;
        var skipNext = 0;

        var buildTag = function(type, token) {
            return $("<span class='" + type + "'>" +
                (token ? token.value : "") + "</span>")[0];
        };

        tokens = tokens.map(function(token) {
            if (token.type === "Identifier") {
                if (token.value === "_") {
                    return children._[_pos++].render().el;
                } else if (token.value.indexOf("$") === 0) {
                    var el = children.vars[token.value.slice(1)].render().el;
                    var typePos = token.value.indexOf("_");
                    if (typePos > 0) {
                        var type = token.value.slice(typePos + 1);
                        var span = buildTag("block block-blank block-" + type +
                            " block-name-" + token.value.slice(1, typePos));
                        span.appendChild(el);
                        el = span;
                    }
                    return el;
                } else {
                    return buildTag("entity name function call", token);
                }
            } else if (token.type === "Punctuator") {
                switch(token.value) {
                    case ".":
                        return buildTag("keyword dot", token);
                    case "=":
                    case "+":
                    case "!":
                    case "-":
                    case "|":
                    case "*":
                    case "/":
                        token.value = " " + token.value + " ";
                        return buildTag("keyword operator", token);
                    case ",":
                        return ", ";
                }
            } else if (token.type === "Keyword") {
                token.value += " ";
                return buildTag("keyword", token);

            } else if (token.type === "Boolean") {
                return buildTag("constant language", token);

            } else if (token.type === "Numeric") {
                return buildTag("constant numeric", token);
            }

            return token.value;
        }).map(function(text) {
            if (typeof text === "string" && text.indexOf("<") === -1) {
                return buildTag("text", {value: text});
            }

            return text;
        });

        if (this.image && this.imagesDir) {
            tokens.push("<img src='" + this.imagesDir + "toolbox/" +
                this.image  + "' class='toolbox-image'/>")
        }

        this.$el.html($("<div>").append(tokens));

        return this;
    }
});