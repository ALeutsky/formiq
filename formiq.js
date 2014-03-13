(function (window, document) {
    var settings = {
        validatorAttr: "data-validator",
        validator: window.validiq
    }

    /**
     * @constructor
     * @param selector
     */
    var fQ = function (selector) {
        if (!(this instanceof fQ)) {
            return new fQ(selector);
        }

        var form;

        if (typeof selector == "string") {
            form = document.querySelector(selector);
        } else if (selector instanceof HTMLFormElement) {
            form = selector;
        } else if (window.jQuery && selector instanceof window.jQuery && selector.length) {
            form = selector[0];
        }

        if (!(form instanceof HTMLFormElement)) {
            throw "Form not found"
        }

        this.form = form;
    }

    /**
     * @name fQ.getValue
     * @return {object}
     */
    fQ.prototype.getValue = function () {
        var i, field, type, name, value,
            result = {},
            fields = this.form.elements;

        for (i = 0; i < fields.length; i++) {
            field = fields[i];

            type = getType(field);
            name = getName(field);

            if (type == "radio" || type == "checkbox") {
                if (isChecked(field)) {
                    value = field.value;
                } else {
                    continue;
                }
            } else {
                value = field.value;
            }

            if (name in result) {
                if (!(result[name] instanceof Array)) {
                    result[name] = [result[name]];
                }
                result[name].push(value);
            } else {
                result[name] = value;
            }
        }

        return result;
    }

    /**
     * @name fQ.setValue
     * @param name
     * @param value
     */
    fQ.prototype.setValue = function (name, value) {
        var values;

        if (typeof name == "string") {
            values = {};
            values[name] = value;
        } else {
            values = name;
        }

        var i, j, field, type,
            fieldPos = {},
            fields = this.form.elements;

        for (i = 0; i < fields.length; i++) {
            field = fields[i];
            name = getName(field);

            if (name in values) {
                type = getType(field);
                value = values[name];

                if (type == "radio" || type == "checkbox") {
                    if (value instanceof Array) {
                        field.checked = false;
                        for (j = 0; j < value.length; j++) {
                            if (field.value == value[j]) {
                                field.checked = true;
                                break;
                            }
                        }
                    } else {
                        field.checked = (field.value == value);
                    }
                } else {
                    if (value instanceof Array) {
                        if (!(name in fieldPos)) {
                            fieldPos[name] = 0;
                        } else {
                            fieldPos[name]++;
                        }

                        field.value = value[fieldPos[name]];
                    } else {
                        field.value = value;
                    }
                }
            }
        }
    }

    /**
     *
     * @return {boolean}
     */
    fQ.prototype.isValid = function () {
        return true
    }

    /**
     * @name fQ.errors
     * @return {object}
     */
    fQ.prototype.errors = function () {
        return this._errors;
    }

    /**
     * @name fQ.submit
     */
    fQ.prototype.submit = function () {
        this.form.submit();
    }

    /**
     * @name fQ.reset
     */
    fQ.prototype.reset = function () {
        this.form.reset();
    }

    /**
     * @name fQ.destroy
     */
    fQ.prototype.destroy = function () {
        this.form = undefined;
    }

    function isChecked (el) {
        return el.checked;
    }

    function isValid (el) {
        var vquery = el.getAttribute(settings.validatorAttr);

        if (vquery) {
            return settings.validator(vquery)(getValue(el));
        } else {
            return true;
        }
    }

    function getType (el) {
        var tagName = el.tagName.toLowerCase();
        return (tagName == "input") ? el.type.toLowerCase() : tagName;
    }

    function getName (el) {
        return el.name;
    }

    function getValue (el) {
        var type = getType(el);

        if (type == "radio" || type == "checkbox") {
            return isChecked(el) ? el.value : undefined;
        } else {
            return el.value;
        }
    }

    window.formiQ = window.fQ = fQ;
}) (window, document);