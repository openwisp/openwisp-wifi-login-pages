Translations
============

Translations are loaded at runtime from the JSON files that were compiled
during the build process according to the available languages defined and
taking into account any customization of the translations.

.. contents:: **Table of contents**:
    :depth: 2
    :local:

Defining Available Languages
----------------------------

If there is more than one language in ``i18n/`` directory then update the
organization configuration file by adding the support for that language
like this:

.. code-block:: yaml

    default_language: "en"
    languages:
      - text: "English"
        slug: "en"
      - text: "Italian"
        slug: "it"

Add Translations
----------------

Translation file with content headers can be created by running:

.. code-block::

    yarn translations-add {language_code} i18n/{file_name}.po

Here ``file_name`` can be ``{orgSlug}_{language_code}.custom.po``,
``{language_code}.custom.po\`` or ``{language_code}.po``.

The files created with the command above are mostly empty because when
adding custom translations it is not needed to extract all the message
identifiers from the code.

If instead you are adding support to a new language or updating the
translations after having changed the code, you will need to extract the
message identifiers, see :ref:`update-translations
<wlp_update_translations>` for more information.

.. _wlp_update_translations:

Update Translations
-------------------

To extract or update translations in the ``.po`` file, use the following
command:

.. code-block:: shell

    yarn translations-update <path-to-po-file>

This will extract all the translations tags from the code and update
``.po`` file passed as argument.

.. _wlp_customizing_translations_specific_language:

Customizing Translations for a Specific Language
------------------------------------------------

Create a translation file with name ``{language_code}.custom.po`` by
running: ``yarn translations-add <language-code>
i18n/{language_code}.custom.po``

Now to override the translation placeholders (``msgid``) add the
``msgstr`` in the newly generated file for that specific ``msgid``:

.. code-block:: text

    msgid ""
    msgstr ""
    "Content-Type: text/plain; charset=UTF-8\n"
    "Plural-Forms: nplurals = 2; plural = (n != 1);\n"
    "Language: en\n"
    "MIME-Version: 1.0\n"
    "Content-Transfer-Encoding: 8bit\n"

    msgid "FORGOT_PASSWORD"
    msgstr "Forgot password? Reset password"

During the build process customized language files will override all the
*msgid* defined in the default language files.

.. note::

    The custom files need not be duplicates of the default file i.e.
    translations can be defined for custom strings (i.e. *msgid* and
    *msgstr*).

Customizing Translations for a Specific Organization and Language
-----------------------------------------------------------------

Create a translation file with name
``{orgSlug}_{language_code}.custom.po`` by running: ``yarn
translations-add <language-code>
i18n/{orgSlug}_{language_code}.custom.po``

To override the translation placeholders (``msgid``) add the ``msgstr`` in
the newly generated file for that specific ``msgid``:

.. code-block:: text

    msgid ""
    msgstr ""
    "Content-Type: text/plain; charset=UTF-8\n"
    "Plural-Forms: nplurals = 2; plural = (n != 1);\n"
    "Language: en\n"
    "MIME-Version: 1.0\n"
    "Content-Transfer-Encoding: 8bit\n"

    msgid "PHONE_LBL"
    msgstr "mobile phone number (verification needed)"

During the build process custom organization language file will be used to
create a JSON translation file used by that specific organization.

.. note::

    Do not remove the content headers from the ``.po`` files as it is
    needed during the build process.
