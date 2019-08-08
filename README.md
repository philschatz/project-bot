# project-bot

[![code coverage][coverage-image]][coverage-url]
[![travis status][travis-image]][travis-url]
[![dependency status][dependency-image]][dependency-url]
[![dev dependency status][dev-dependency-image]][dev-dependency-url]

Do you like the idea of [GitHub's Project Automation feature](https://github.com/blog/2458-keep-your-project-boards-up-to-date-automatically) but find it lacking?

This bot will **automatically** _add_ new Issues or Pull Requests to a Project board based on specially formatted Cards in each Column of a Project. It also allows you to customize the rules for _moving_ Issues between Columns.


## Installation

Go to the [project-bot GitHub App](https://github.com/apps/project-bot) page and click `[Install]` (or `[Configure]` if you already installed it) to have it run on **Public** Project Boards.

To see what it looks like, you can look at the [GitHub projects for this repository](https://github.com/philschatz/project-bot/projects).


## Example

To create an Automation Card, create a Card in a Project like this:

```md
###### Automation Rules

<!-- Documentation: https://github.com/philschatz/project-bot -->

- `assigned_issue`
- `closed_issue`
- `added_label` **wontfix**
- `new_pullrequest` **repo1** **repo2**
```

Now, whenever any Issue that is assigned, or closed, or a `wontfix` label is added, or a new Pull Request is opened on the `repo1` or `repo2` repository will show up in this Column.


## Syntax

This bot uses normal Project Board note cards with Markdown formatting for configuration. 

### Automation Cards

- Automation Cards are identified by the string `###### Automation Rules` that _has_ to be used in the note text
- The automation card must be at any the top or bottom of a column (but they tend to end up at the bottom as new cards are added at the top automatically)
- There can be multiple automation cards per column, but you will probably not need that (unless you have _many_ rules or add items from _many_ repositories)
- An automation card can contain other text besides the headline and rules if you really need it to (but best avoid other lists to confuse the parser)

### Rules

- Rules have to be listed in an unnumbered list in the Automation Card
- This list can contain as many rules as you like
- The rule (see list below) _should_ to be wrapped in \` like so:
  ```
  - `example_rule`
  ```
- Rule Parameters _should_ be wrapped in `**` like so:
  ```
  - `example_rule` **param 1** **param 2**
  ```
- Items are added or moved into the column when _any_ of the rules in the list are triggered. (It is currently _not_ possible to use boolean logic to combine any rules.)

## Available Rules

The following rules can be included in automation cards:

## Add items

To add items to the project board, you have these two rules:

- `new_issue`: When an Issue is created (optionally, a space-separated set of repo names)
- `new_pullrequest`: When a Pull Request is created (optionally, a space-separated set of repo names)

## Move items

After an item has been added to a project board (manually or by the previous rules) it can be moved to another column by one of the following rules:

### Issues
- `edited_issue`: When an Issue is edited
- `assigned_issue`: When an Issue is assigned to a user (but was not before)
- `assigned_to_issue`: When an Issue is assigned to a specific user
- `unassigned_issue`: When an Issue is no longer assigned to a user
- `milestoned_issue`: When an Issue is added to a Milestone
- `demilestoned_issue`: When an Issue is removed from a Milestone
- `closed_issue`: When an Issue is closed
- `reopened_issue`: When an Issue is reopened

### Pull Requests
- `assigned_pullrequest`: When a Pull Request is assigned to a user (but was not before)
- `unassigned_pullrequest`: When a Pull Request is no longer assigned to a user
- `added_reviewer`: (optional username or array of usernames that need to be added)
- `accepted_pullrequest`: When at least one Reviewer Accepted, and there are no Rejections on a Pull request
- `merged_pullrequest`: When a Pull Request is merged
- `closed_pullrequest`: When a Pull Request is closed
- `reopened_pullrequest`: When a Pull Request is reopened

### Labels
- `added_label`: (requires exactly one argument, the string representing the name of the label)
- `removed_label`: (requires exactly one argument, the string representing the name of the label)

### Other

- Not finding the event you would like? Just create a new Issue in this Repository!


## Screencap

![automatic-project-columns](https://user-images.githubusercontent.com/253202/37872089-ad7d21ea-2fcd-11e8-81ba-7f3977c102cf.gif)

[coverage-image]: https://img.shields.io/codecov/c/github/philschatz/project-bot.svg
[coverage-url]: https://codecov.io/gh/philschatz/project-bot
[travis-image]: https://api.travis-ci.com/philschatz/project-bot.svg
[travis-url]: https://travis-ci.com/philschatz/project-bot
[dependency-image]: https://img.shields.io/david/philschatz/project-bot.svg
[dependency-url]: https://david-dm.org/philschatz/project-bot
[dev-dependency-image]: https://img.shields.io/david/dev/philschatz/project-bot.svg
[dev-dependency-url]: https://david-dm.org/philschatz/project-bot?type=dev