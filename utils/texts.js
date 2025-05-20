export default {
  uk: {
    main_error_message: "**❌Виникла помилка при виконанні Вашої команди.**",
    no_perms: "**❌У вас немає прав на використання цієї команди**",
    test: "⚙️Статистика бота",
    ping_field1: "Пінг бота:",
    ping_field2: "Аптайм",
    ping_field3: "Бібліотека",
    warns_NaN: "Будь ласка, введіть валідний числовий ID.",
    warns_noWarns: "Попередження для ${userId}",
    warns_not_found: "Попереджень немає в базі даних.",
    warns: "Попередження: ${warnings_count}",
    warns_description: "У користувача ${userId} ${warnings_count} попереджень",
    warns_author: "Автор:",
    warns_reason: "Причина:",

    dashboard_button: "Панель",

    setup_successful: "Успішно!",
    setup_role_cant_setup_content: "**❌ Я не можу керувати цією роллю.**",
    setup_role_canManage: "• Моя найвища роль нижча за вказану.",
    setup_role_systemRole: "• Це системна роль (@everyone або інтегрована).",
    setup_no_perms: "• У мене немає прав Керувати Ролями.",
    setup_unverifedrole_not_found: "**❌ Призначте роль не верифікованого користувача перед використанням цієї команди!**",
    setup_verifedrole_not_found: "**❌ Призначте роль верифікованого користувача перед використанням цієї команди!**",
    setup_verificationchannel_not_found: "**❌ Призначте канал верифікації перед використанням цієї команди!**",
    setup_webhook_not_found: "❌ Вебхук не знайдено!",
    setup_verificationchannel_setuped: "Система верифікації призначена в ${verifyChannel}.",
    setup_role_removed:
      "Роль <@&${role}> була успішно видалена з білого списку!",
    setup_role_not_found: "**❌Не вдалось знайти вказану Вами роль!**",
    setup_logchannel_changed: "Webhook логів було успішно змінено!",
    setup_logchannel_webhoook_isthesame: "**❌Цей webhook уже призначений**",
    setup_whitelist_changed: "Роль успішно додано до whitelist: ${role}",
    setup_whitelist_already_is: "**❌Ця вже є у whitelist**",
    setup_language_changed: "Мову на гільдії було успішно змінено на ${lang}",
    setup_banusers_enabled:
      "Блокування користувачів та запрошень на гільдії було успішно **увімкнено**!",
    setup_banusers_disabled:
      "Блокування користувачів та запрошень на гільдії було успішно **вимкнено**!",
    setup_banusers_isthesame: "**❌Цей параметр вже призначений на гільдії**",
    setup_logchannel_reset: "Канал логів було успішно видалено!",
    settings_enabled: "Увімкнено",
    settings_disabled: "Вимкнено",
    settings_nodata: "Немає даних",
    settings_title: "Налаштування спільноти",
    settings_description:
      "Ознайомтесь із командами та параметрами нижче.\n**Переглядати та змінювати налаштування може лише __власник серверу__.**",
    settings_logchannel: "Webhook логів",
    settings_whitelist: "Білий список",
    settings_blocking: "Блокування запрошень та користувачів",
    settings_didnt_setup: "не призначено",
    settings_footer: "Напишіть /setup для зміни налаштувань",

    settings_joinrole_title: "Роль при приєднанні",
    settings_verifedrole_title: "Роль після верифікації",

    dm_title: "Блокування",
    dm_description: "Ви були заблоковані на гільдії **${guild_name}**.",
    dm_reason: "чорний список",
    no_link_title: "❌Посилання заблоковано",
    no_links_description:
      "На даній гільдії заборонено використовувати запрошувальні посилання",
    guild_logs_member_banned: "Користувач заблокований",
    guild_logs_member_banned_description:
      "Користувач мав 3 попередження - та був заблокований.",
    guild_logs_field_user: "Користувач:",
    guild_logs_field_channel: "Канал",
    guild_logs_member_solved_captcha_title: "Користувач успішно виконав капчу",
    guild_logs_member_failed_captcha_title: "Користувач провалив капчу",
    guild_logs_sent_captcha: "Згенерована капча:",
    guild_logs_got_answer: "Отримана відповідь",
    reason_three_warnings: "3/3 попередження",

    banned_link: "Блокування запрошення",
    message: "Повідомлення:",

    help_title: "Інформація",
    help_description: "Переконайтеся, що бот має високу роль на сервері.",
    help_field_one: "Список команд",
    help_value_one:
      "</ping:1335314538568089698> - показує статус та пінг бота\n</settings:1335314538568089695> - показує налаштування вашої гільдії\n</setup whitelist:1335314538568089696> - додання ролей в білий список на гільдії\n</setup whitelist_remove:1342824436092371011> - видаляє роль з білого списку\n</setup ban_users:1335314538568089696> - вмикає функцію блокування запрошень та коричтувачів в чорному списку\n</setup log_channel:1335314538568089696> - призначає Webhook для логів\n</warns:1335314538568089697> - переглянути список попереджень користувача",
    help_field_two: "Корисні посилання",
    help_value_two: "Сервер підтримки",
    help_value_three: "Панель налаштування",
    send_modal_bug_title: "Відправлення багу",
    send_modal_bug_input_one: "Суть помилки",
    send_modal_bug_input_two: "Як відтворити баг?",

    bug_succeffsull:
      "Ви успішно відправили знайдену помилку. Дякую за підтримку!",
    
    verification_successful_title: "🎉 Ви успішно пройшли верифікацію!",
    verification_successful_description: "Тепер ви можете спілкуватись на цьому сервері!",

    verification_failed_title: "💀 Ви провалили верифікацію",
    verification_failed_description: "Ви ввели неправильну капчу... Будь ласка, спробуйте ще раз.",
    verification_embed_author: "Перевірка на робота",
    verification_title: "Ласкаво просимо!",
    verification_description: "Цей сервер вимагає верифікацію перед тим як надати доступ до нього.\nПеред тим, як Ви отримаєте доступ до серверу - ви повинні пройти верифікацію",
    verification_already_verifed: "Ви вже верифіковані",

    verification_answer_description: "Будь ласка, натисніть кнопку **Ввести** нижче і введіть код капчі.`",
    verification_answer_footer: "У вас є 60 секунд, щоб завершити капчу",
    verification_put_captcha: "Введіть капчу",
    verification_old_captchd: "Капча застарала. Будь ласка, спробуйте знову."
  },
  en: {
    main_error_message: "**❌An error occurred while executing your command.**",
    no_perms: "**❌You do not have permission to use this command**",
    test: "⚙️Bot Statistics",
    ping_field1: "Bot ping:",
    ping_field2: "Uptime",
    ping_field3: "Library",
    warns_NaN: "Please enter a valid numeric ID.",
    warns_noWarns: "Warnings for ${userId}",
    warns_not_found: "No warnings found in the database.",
    warns: "Warnings: ${warnings_count}",
    warns_description: "User ${userId} has ${warnings_count} warnings",
    warns_author: "Author:",
    warns_reason: "Reason:",

    setup_successful: "Successful!",
    setup_role_cant_setup_content: "**❌ I can't manage this role.**",
    setup_role_canManage: "• My highest role is lower than the specified one.",
    setup_role_systemRole: "• This is a system role (@everyone or built-in).",
    setup_no_perms: "• I do not have the Manage Roles permission.",
    setup_unverifedrole_not_found: "**❌ You must to setup join role before use this command!**",
    setup_verifedrole_not_found: "**❌ You must to setup verified role before use this command!**",
    setup_verificationchannel_not_found: "❌ You must to setup captcha channel before use this command!",
    setup_webhook_not_found: "**❌ Webhook not found!**",
    setup_verificationchannel_setuped: "Captcha channel has been setup to ${verifyChannel}.",
    setup_role_removed: "Role <@&${role}> has been removed from whitelist!",
    setup_role_not_found: "**❌Failed to find role!**",
    setup_logchannel_changed: "Webhook logs have been successfully changed!",
    setup_logchannel_webhoook_isthesame:
      "**❌This webhook is already assigned**",
    setup_whitelist_changed:
      "Role successfully added to the whitelist: ${role}",
    setup_whitelist_already_is: "**❌This role is already in the whitelist**",
    setup_language_changed:
      "The language of the guild has been successfully changed to ${lang}",
    setup_banusers_enabled:
      "User and invite blocking on the guild has been successfully **enabled**!",
    setup_banusers_disabled:
      "User and invite blocking on the guild has been successfully **disabled**!",
    setup_banusers_isthesame:
      "**❌This setting is already assigned on the guild**",
    setup_logchannel_reset: "Log channel has been successfully removed!",
    settings_enabled: "Enabled",
    settings_disabled: "Disabled",
    settings_nodata: "No data",
    settings_title: "Community Settings",
    settings_description:
      "Check out the commands and parameters below.\n**Only the __server owner__ can view and modify settings.**",
    settings_logchannel: "Webhook Logs",
    settings_whitelist: "Whitelist",
    settings_blocking: "Invite and user blocking",
    settings_didnt_setup: "not assigned",
    settings_footer: "Use /setup to change settings",

    settings_joinrole_title: "Join role",
    settings_verifedrole_title: "Role after verification",
    dashboard_button: "Dashboard",

    dm_title: "Blocking",
    dm_description: "You have been blocked on the guild **${guild_name}**.",
    dm_reason: "blacklist",
    no_link_title: "❌Link Blocked",
    no_links_description: "Invite links are prohibited on this guild",
    guild_logs_member_banned: "User Banned",
    guild_logs_member_banned_description:
      "A user has 3 warnings - and was banned.",
    guild_logs_field_user: "User:",
    guild_logs_field_channel: "Channel",
    guild_logs_member_solved_captcha_title: "User successful solved the captcha",
    guild_logs_member_failed_captcha_title: "User failed the captcha",
    guild_logs_sent_captcha: "Generated captcha:",
    guild_logs_got_answer: "User responce",
    reason_three_warnings: "3/3 warnings",

    banned_link: "Invite Blocking",
    message: "Message:",

    help_title: "Information",
    help_description: "Make sure the bot has a high role on the server.",
    help_field_one: "Command List",
    help_value_one:
      "</ping:1335314538568089698> - shows the bot's status and ping\n</settings:1335314538568089695> - displays your guild's settings\n</setup whitelist:1335314538568089696> - adds roles to the guild's whitelist\n </setup whitelist_remove:1342824436092371011> - remove role from whitelist\n</setup ban_users:1335314538568089696> - enables the feature to block invites and blacklist users\n</setup log_channel:1335314538568089696> - assigns a Webhook for logs\n</warns:1335314538568089697> - view a user's warning list",
    help_field_two: "Useful Links",
    help_value_two: "Support Server",

    help_value_three: "Bot dashboard site",
    send_modal_bug_title: "Bug report",
    send_modal_bug_input_one: "Describe the problem",
    send_modal_bug_input_two: "How to reproduce the bug?",

    bug_succeffsull:
      "The bug has been sent successfully. Thank you for support!",

    verification_successful_title: "🎉 You have successfully passed verification!",
    verification_successful_description: "Now you can chat on this server!",

    verification_failed_title: "💀 You failed verification",
    verification_failed_description: "You entered an incorrect captcha... Please try again.",

    verification_embed_author: "Verify that you're not a robot",
    verification_title: "Welcome!",
    verification_description: "This server requires verification before access is granted.\nBefore you will get member role - please, complete captcha.",
    verification_already_verifed: "You're already verified.",
    verification_put_captcha: "Write the captcha code",
    verification_answer_description: "Please click the **Enter** button below and enter the captcha code.`",
    verification_answer_footer: "You have 60 seconds to solve the captcha.",
  },
};
