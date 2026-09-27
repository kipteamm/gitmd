from itertools import chain
from wtforms import Form, PasswordField, validators


def get_errors(form: Form) -> str:
    if not form.errors:
        return ""

    flattened_errors = list(chain.from_iterable(form.errors.values()))
    return ", ".join(flattened_errors)


class SetupForm(Form):
    password = PasswordField("Password", [
        validators.InputRequired(message="Password is required."),
        validators.Length(min=8, max=128),
    ])
