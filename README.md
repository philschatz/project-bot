# project-bot

Do you like the idea of [GitHub's Project Automation feature](https://github.com/blog/2458-keep-your-project-boards-up-to-date-automatically)
but find it lacking?

GitHub's Project Automation feature will add a new Issue or Pull Request once you have manually assigned it to a Project. This bot will **automatically** add new Issues or Pull Requests to a Project board based on specially formatted Cards in each Column of a Project.

It also allows you to customize the rules for moving Issues between Columns.


# Installation

Go to [The project-bot App homepage](https://github.com/apps/project-bot) and click `[Configure]` to have it run on **Public** Project Boards.

To see what it looks like, you can look at the [Projects for this Repository](https://github.com/philschatz/project-bot/projects).


# Example Automation Card

To create an Automation Rule, create a Card in a Project like this:

```md
###### Automation Rules

<!-- Documentation: https://github.com/philschatz/project-bot -->

- `assigned_issue`
- `closed_issue`
- `added_label` **wontfix**
- `new_pullrequest` **repo1** **repo2**
```

Now, whenever any Issue that is assigned, or closed, or a `wontfix` label is added, or a new Pull Request is opened on the `repo1` or `repo2` repository will show up in this Column.


# Rules

The type of rules outlined in there are:

## Issues
- `new_issue`: When an Issue is created (optionally, a space-separated set of repo names)
- `edited_issue`: When an Issue is edited
- `assigned_issue`: When an Issue is assigned to a user (but was not before)
- `assigned_to_issue`: When an Issue is assigned to a specific user
- `unassigned_issue`: When an Issue is no longer assigned to a user
- `milestoned_issue`: When an Issue is added to a Milestone
- `demilestoned_issue`: When an Issue is removed from a Milestone
- `closed_issue`: When an Issue is closed
- `reopened_issue`: When an Issue is reopened

## Pull Requests
- `new_pullrequest`: When a Pull Request is created (optionally, a space-separated set of repo names)
- `assigned_pullrequest`: When a Pull Request is assigned to a user (but was not before)
- `unassigned_pullrequest`: When a Pull Request is no longer assigned to a user
- `added_reviewer`: (optional username or array of usernames that need to be added)
- `accepted_pullrequest`: When at least one Reviewer Accepted, and there are no Rejections on a Pull request
- `merged_pullrequest`: When a Pull Request is merged
- `closed_pullrequest`: When a Pull Request is closed
- `reopened_pullrequest`: When a Pull Request is reopened

## Labels
- `added_label`: (requires exactly one argument, the string representing the name of the label)
- `removed_label`: (requires exactly one argument, the string representing the name of the label)

## Other
- Not finding the event you would like? Just create a new Issue in this Repository!


# Screencap

![automatic-project-columns](https://user-images.githubusercontent.com/253202/37872089-ad7d21ea-2fcd-11e8-81ba-7f3977c102cf.gif)
