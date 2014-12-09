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

        this.trigger("updated");
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

    // Move the position of the toolbox on scroll
    scroll: function(top) {
        this.el.style.top = top + "px";
    },

    render: function() {
        var html = [];
        var toolbox = this.toolbox;

        _.keys(toolbox).forEach(function(category) {
            var groupHTML = [];

            groupHTML.push("<h3>" + category + "</h3>");

            toolbox[category].forEach(function(item) {
                var $item = item.render().$el;

                $item.data("drag-data", item.toAST());

                $item.draggable({
                    appendTo: ".block-toolbox-editor",
                    connectToSortable: ".block-statements",
                    helper: function() {
                        return $item.clone(true);
                    },
                    revert: false
                });

                groupHTML.push($item);
            });

            html.push($("<div>").addClass("toolbox-group").html(groupHTML));
        });

        var getPlaceholder = function(ui) {
            return ui.draggable.parent().children(".ui-sortable-placeholder");
        };

        var $trash = $("<div>")
            .addClass("block-trash")
            .droppable({
                over: function(e, ui) {
                    ui.draggable.data("trash-over", true);

                    var multi = ui.draggable.data("multi");

                    if (multi) {
                        multi.triggerHandler("overTrash");
                    } else {
                        ui.draggable.triggerHandler("overTrash");
                    }

                    ui.helper.addClass("trash-over");
                    ui.draggable.addClass("trash-over");
                    getPlaceholder(ui).addClass("trash-over");

                    $(this).addClass("over");
                },
                out: function(e, ui) {
                    ui.draggable.data("trash-over", false);

                    var multi = ui.draggable.data("multi");

                    if (multi) {
                        multi.triggerHandler("outTrash");
                    } else {
                        ui.draggable.triggerHandler("outTrash");
                    }

                    ui.helper.removeClass("trash-over");
                    ui.draggable.removeClass("trash-over");
                    getPlaceholder(ui).removeClass("trash-over");

                    $(this).removeClass("over");
                },
                drop: function(e, ui) {
                    // Remove item when dropped inside the trash
                    var multi = ui.draggable.data("multi");
                    var placeholder = getPlaceholder(ui);

                    var index = ui.draggable.parent().children()
                        .not(".ui-sortable-helper")
                        .not(multi || ui.draggable)
                        .index(placeholder);

                    if (multi) {
                        multi.each(function() {
                            $(this).trigger("sort-removed", index);
                            $(this).remove();
                        });

                    } else {
                        ui.draggable.trigger("sort-removed", index);
                        ui.draggable.remove();
                    }

                    $(this).removeClass("over");
                }
            });

        html.push($trash);

        this.$el.html(html);

        // Blur the active input if the focus has moved (e.g. starting a
        // selection or a drag)
        this.$el.on("mousedown touchstart", ".block-statement .block-wrapper", function(e) {
            // Everything else becomes inactive
            $(".input.active, .block-statement.active").removeClass("active");
            $(".block-statement.ui-selected").removeClass("ui-selected");

            $(this).closest(".block-statement").addClass("active");
        });

        // Remove the active state class on focusout
        // (only happens on desktop when tabbing around)
        this.$el.on("mouseup mouseleave touchend touchleave", ".block-statement .block-wrapper", function(e) {
            $(this).closest(".block-statement").removeClass("active");
        });

        return this;
    }
});

var JSToolboxEditor = Backbone.View.extend({
    events: {
        "scroll": "scroll"
    },

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

    scroll: function() {
        // Prevent any horizontal scrolling
        this.el.scrollLeft = 0;

        // Pass the top scroll position to the toolbox so that it can
        // re-position itself
        this.toolbox.scroll(this.el.scrollTop);
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
            code = code.toString();
        }

        if (typeof code === "string") {
            // Remove any sort of wrapper function
            code = code.replace(/^function\s*\(\s*\)\s*{([\s\S]*)}$/, "$1");
            code = JSRules.parseCode(code).body;
        }

        var $ret = $("<div>");
        var vars = {};
        var varStyles = ["one", "two", "three", "four", "five", "six",
            "seven"];

        code.forEach(function(ast) {
            var rule = JSRules.findRule(ast);
            rule.render().$el.appendTo($ret);
        });

        // Remove all the inputs and replace them with just the text
        $ret.find("input").each(function() {
            var value = this.value;
            var className = "input " + this.className;

            if (value === "_") {
                value = "&nbsp;";
            } else if (value.indexOf("$") === 0) {
                value = "&nbsp;";
                var varName = value.slice(1);

                if (!(varName in vars)) {
                    vars[varName] = varStyles[_.keys(vars).length] ||
                        "extra";
                }

                className += " " + vars[varName];
            }

            $(this).replaceWith($("<span>")
                .html(value)
                .addClass(className));
        });

        return $ret[0].outerHTML;
    },

    render: function() {
        // From: https://github.com/luster-io/prevent-overscroll
        // NOTE: We actually don't want to delegate this, want it
        // to be on this element, directly.
        this.$el.on("touchstart", function(e) {
            var top = this.scrollTop;
            var totalScroll = this.scrollHeight;
            var currentScroll = top + this.offsetHeight;

            // Don't allow scrolling if there is nothing to scroll!
            if (totalScroll === this.offsetHeight) {
                // Don't prevent the touchstart event when the user is
                // attempting to update an input
                if (e.target.nodeName.toLowerCase() !== "input") {
                    e.preventDefault();
                }
            } else if (top <= 0) {
                this.scrollTop = 1;
            } else if (currentScroll >= totalScroll) {
                this.scrollTop = top - 1;
            }
        });

        this.$el.addClass("block-toolbox-editor");
        this.$el.children().detach();
        this.$el.append([
            this.toolbox.render().$el,
            this.editor.render().$el
        ]);
    }
});

var JSRules = {
    rules: [],

    isTouchDevice: !!("ontouchstart" in window),

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

    textWidth: function(text) {
        if (!this.$textSize) {
            this.$textSize = $("<span>").hide()
                .addClass("block").appendTo("body");
        }

        // Replace spaces with non-breaking spaces to preserve width
        this.$textSize.text(text.replace(/\s/g, "\xA0"));

        return Math.max(this.$textSize.outerWidth(), 10) + 10;
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

    parseCode: function(code) {
        var ast = esprima.parse(code,
            {range: true, tokens: true, comment: true});
        return escodegen.attachComments(ast, ast.comments, ast.tokens);
    },

    parseProgram: function(code) {
        return new JSProgram({
            node: this.parseCode(code)
        });
    },

    parseStructure: function(fn) {
        return this.parseCode("(" + fn + ")").body[0].expression.body.body[0];
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
        "trashOut": "trashOut",
        "trashOver": "trashOver",
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

    isComment: function() {
        return false;
    },

    trashOut: function() {
        this.$el.removeClass("trash-over");
    },

    trashOver: function() {
        this.$el.addClass("trash-over");
    },

    drop: function() {
        // Ignore the cases where this isn't a new draggable coming in
        if (!this.$el.hasClass("ui-draggable")) {
            return;
        }

        // Remove the draggable related classes/styling
        this.$el.removeClass("ui-draggable ui-draggable-handle active")
            .css({width: "", height: ""});

        var $el = this.$el;

        // To animate in the element on drop
        setTimeout(function() {
            $el.addClass("ui-selectee");
        }, 0);

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
            this.triggerUpdate();
        }
    },

    triggerUpdate: function() {
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
        var newMatches = [];

        matches.forEach(function(match) {
            if (match.leadingComments) {
                newMatches = newMatches.concat(match.leadingComments);
            }
            newMatches.push(match);
            if (match.trailingComments) {
                newMatches = newMatches.concat(match.trailingComments);
            }
        });

        return new JSStatements(newMatches, {
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
        var code = escodegen.generate(this.toAST(), {comment: true});

        // Following comments are placed on the same line as the previous
        // statement (which is weird). We change this.
        code = code.replace(/;    \/\//g, ";\n\n//");

        return code;
    },

    getAST: function() {
        var state = this.match;
        var ret = {_: [], vars: {}, leadingComments: []};

        for (var i = 0; i < state._.length; i++) {
            var match = state._[i];
            if (_.isArray(match)) {
                var array = this.astComponentArray(match, "_", i);
                ret.leadingComments =
                    ret.leadingComments.concat(array.leadingComments);
                ret._[i] = array.data;
            } else {
                ret._[i] = this.astComponent(match, "_", i);
            }
        }

        for (var name in state.vars) {
            var match = state.vars[name];
            if (_.isArray(match)) {
                var array = this.astComponentArray(match, "vars", name);
                ret.leadingComments =
                    ret.leadingComments.concat(array.leadingComments);
                ret.vars[name] = array.data;
            } else {
                ret.vars[name] = this.astComponent(match, "vars", name);
            }
        }

        return ret;
    },

    astComponent: function(match, ns, id) {
        return this.children[ns][id].toAST();
    },

    astComponentArray: function(matches, ns, id) {
        var ret = {data: [], leadingComments: []};

        this.children[ns][id].forEach(function(model) {
            var ast = model.toAST();

            if (model.isComment()) {
                if (ret.data.length > 0) {
                    var last = ret.data[ret.data.length - 1];
                    if (!last.trailingComments) {
                        last.trailingComments = [];
                    }
                    last.trailingComments.push(ast);
                } else {
                    ret.leadingComments.push(ast);
                }
            } else {
                ret.data.push(ast);
            }
        })

        return ret;
    },

    // TODO: Move this into some sort of collection renderer
    renderStatements: function(collection) {
        var $div = $("<div>").addClass("block block-statements");

        $div.html(collection.map(function(statement) {
            return statement.render().el;
        }));

        var getIndex = function(ui) {
            if (ui.helper) {
                var exclude = ui.item.data("multi") || ui.item;
                return ui.placeholder.parent().children()
                    .not(".ui-sortable-helper")
                    .not(exclude)
                    .index(ui.placeholder);
            } else {
                return ui.item.index();
            }
        };

        // Enable a selection box to be drawn around the statements
        if (!JSRules.isTouchDevice) {
            // NOTE(jeresig): Disabling until after Hour of Code
            // See: https://github.com/Khan/structured-blocks/issues/77
            //$div.selectable({
            //    filter: ".block-statement",
            //    cancel: ".block-statement *"
            //});
        }

        // Blur the active input if the focus has moved (e.g. starting a
        // selection or a drag)
        $div.on("mousedown focusin touchstart", function(e) {
            var $curActive = $(".input.active");
            var $check = $curActive.parent();
            var $target = $(e.target);

            if ($target.closest(".block-wrapper").length === 0) {
                $(".ui-selected").removeClass("ui-selected");
                $curActive.removeClass("active").blur();

            } else if (!$check[0] ||
                (!$.contains($target[0], $check[0]) &&
                !$.contains($check[0], $target[0]))) {
                $curActive.removeClass("active").blur();

                if ($target.hasClass("input")) {
                    $target.addClass("active");
                }

                // Update the selection to make sure the statement
                // we're inside of is marked as selected.
                var $block = $target.closest(".block-statement");
                var $selected = $block.siblings(".ui-selected");

                $selected.removeClass("ui-selected");
                $block.addClass("ui-selected");
            }
        });

        // Since we cancel mouse interactions on the block-statement children
        // we need to replicate the selection interaction.
        $div.on("click", ".block-statement .block-wrapper", function(e) {
            var $block = $(this).closest(".block-statement");
            var $selected = $block.siblings(".ui-selected");

            if (e.metaKey || e.ctrlKey) {
                $block.toggleClass("ui-selected");

            } else if ($block.hasClass("ui-selected")) {
                if ($selected.length > 0) {
                    $selected.removeClass("ui-selected");
                }

            } else {
                $selected.removeClass("ui-selected");
                $block.addClass("ui-selected");
            }
        });

        $(document).on("keydown", function(e) {
            // Ignore actions in text inputs
            if ($(e.target).is("input, textarea")) {
                return;
            }

            // ESC
            if (e.which === 27) {
                $div.children().removeClass("ui-selected");
                e.preventDefault();

            // Backspace and delete keys
            } else if (e.which === 8 || e.which === 46) {
                /*
                // NOTE(jeresig): Disabled temporarily during Hour of Code.
                var $selected = $div.children(".ui-selected");

                $selected.each(function() {
                    $(this).trigger("sort-removed", $(this).index());
                    $(this).remove();
                });
                */

                e.preventDefault();
            }
        });

        var ignoreNextOut = false;
        var external = true;
        var added = false;

        $div.sortable({
            appendTo: ".block-toolbox-editor",
            revert: false,
            handle: ".block-wrapper > .grab-handle",
            scroll: true,
            scrollSensitivity: 10,
            scrollSpeed: 10,
            helper: function(e, $item) {
                if (!$item.hasClass("ui-selected")) {
                    // Un-select all the other nodes, if we just clicked this
                    $item.parent().children().removeClass("ui-selected");

                    // And mark this one as selected
                    $item.addClass("ui-selected");
                }

                // Find the selected elements
                var $selected = $item.parent().children(".ui-selected");
                var $clone = $selected.clone(true);

                // Add all the dragged nodes to a data property
                $item.data("multi", $selected);

                // Remember where the dragged elements started
                $item.data("multi-curIndex", $selected.first().index());

                // Compute a sane width on the helper, this should be equal to
                // the width of the largest element being dragged
                var maxWidth = 0;

                $selected.each(function() {
                    var width = $(this).children().outerWidth(true);
                    maxWidth = Math.max(width, maxWidth);
                });

                // Remove all the other elements that are being dragged
                $selected.not($item[0]).hide();

                // Refresh the sortable list after the nodes have been removed
                $div.sortable("refresh");

                return $("<div>").addClass("block-wrapper")
                    .html($clone).width(maxWidth);
            },
            start: function(e, ui) {
                ignoreNextOut = false;
                external = ui.helper.hasClass("ui-draggable");
                added = !external;

                // De-select any already-selected elements when a new external
                // element is added.
                if (external) {
                    ui.item.parent().children().removeClass("ui-selected");

                // Show the "trash" drop area
                } else {
                    var $trash = $(".block-trash").show();
                    setTimeout(function() {
                        $trash.addClass("visible");
                        ui.placeholder.addClass("inline");
                    }, 0);
                }
            },
            change: function(e, ui) {
                var multi = ui.item.data("multi");
                var index = getIndex(ui);

                if (!multi) {
                    ui.item.trigger("sort-update", index);
                    return;
                }

                var curIndex = ui.item.data("multi-curIndex");
                var past = (index > curIndex);

                ui.item.data("multi-curIndex", index);

                if (past) {
                    index += multi.length - 1;
                }

                // Insert the items in reverse, to make sure they'll
                // be in the right position upon completion.
                multi.each(function() {
                    $(this).trigger("sort-update", index);
                    if (!past) {
                        index += 1;
                    }
                });
            },
            over: function(e, ui) {
                // If we're dealing with an in-sortable item or an external
                // draggable that we've already seen, we stop.
                if (!external || added) {
                    return;
                }

                ignoreNextOut = true;
                added = true;

                var data = ui.helper.data("drag-data");
                ui.placeholder.trigger("sort-added",
                    [data, getIndex(ui), ui.item]);

                // An 'out' event fires immediately after the first over
                // event, so we quickly ignore it.
                setTimeout(function() {
                    ignoreNextOut = false;
                }, 0);
            },
            out: function(e, ui) {
                if (ignoreNextOut) {
                    ignoreNextOut = false;
                    return;
                }

                // If we're dealing with an in-sortable item or an external
                // draggable that we've already removed, we stop.
                if (!external || !added) {
                    return;
                }

                added = false;

                // Remove the model when the external draggable is moved
                // outside of the sortable (sortable already removes the elem)
                ui.item.trigger("sort-removed", getIndex(ui));
            },
            beforeStop: function(e, ui) {
                // An 'out' event happens during the stop phase, we ignore
                // it there, as well.
                ignoreNextOut = true;

                var multi = ui.item.data("multi");

                if (multi) {
                    // Move all the elements to be after the placeholder
                    multi.show().insertAfter(ui.placeholder);
                }
            },
            stop: function(e, ui) {
                // Trigger drop event
                var multi = ui.item.data("multi");

                if (multi) {
                    multi.triggerHandler("drop");

                    // NOTE(jeresig): Do we want to do this for only single?
                    multi.removeClass("ui-selected");

                } else {
                    ui.item.triggerHandler("drop");
                    ui.item.removeClass("ui-selected");
                }

                // Remove any multi drag data
                ui.item.removeData("multi");

                var $trash = $(".block-trash").removeClass("visible");
                setTimeout(function() {
                    $trash.hide();
                }, 500);
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
                        var name = token.value.slice(1, typePos);
                        var span = buildTag("block block-blank block-" + type +
                            " block-name-" + name);
                        span.appendChild(el);
                        var nameTag = buildTag("block-name");
                        nameTag.appendChild(buildTag("block-text", {value: name}));
                        span.appendChild(nameTag);
                        el = span;
                    }
                    return el;
                } else {
                    return buildTag("entity name function call show-toolbox",
                        token);
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

        tokens.unshift($(buildTag("grab-handle")).html([
            // Add a grabber handle
            buildTag("grabber"),
            tokens.shift()
        ]));

        if (this.image && this.imagesDir) {
            tokens.unshift("<img src='" + this.imagesDir + "toolbox/" +
                this.image  +
                "' class='show-toolbox show-only-toolbox toolbox-image'/>");
        }

        this.$el.html($("<div>").addClass("block-wrapper").append(tokens));

        if (this.postRender) {
            this.postRender();
        }

        return this;
    }
});

var JSASTColorRule = JSASTRule.extend({
    additionalEvents: {
        updateColor: "updateColor"
    },

    updateColor: function(e, color) {
        this.children.vars.r_rgb.setValue(color.r);
        this.children.vars.g_rgb.setValue(color.g);
        this.children.vars.b_rgb.setValue(color.b);

        this.postRender();
    },

    postRender: function() {
        var color;
        try {
            color = {
                r: this.children.vars.r_rgb.getValue(),
                g: this.children.vars.g_rgb.getValue(),
                b: this.children.vars.b_rgb.getValue()
            };
        } catch(e) {
            // In the case of no values, just default to white
            //  (happens for hint code in challenges)
            color = {
                r: 255, g: 255, b: 255
            };
        }
        this.$el.data("color", color);

        this.children.vars.r_rgb.$el.parent().css("background",
            "rgb(" + [color.r, color.g, color.b].join(",") + ")");
    }
});