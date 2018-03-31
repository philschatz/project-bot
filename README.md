# project-bot

Do you like the idea of [GitHub's Project Automation feature](https://github.com/blog/2458-keep-your-project-boards-up-to-date-automatically)
but find it lacking?

GitHub's Project Automation feature will add a new Issue or Pull Request once you have manually assigned it to a Project. This bot will **automatically** add new Issues or Pull Requests to a Project board based on specially formatted Cards in each Column of a Project.

It also allows you to customize the rules for moving Issues between Columns.

# Example Automation Card

To create an Automation Rule, create a Card in a Project like this:

```md
###### Automation Rules

<!-- Documentation: https://github.com/philschatz/project-bot -->

- `assigned_issue`
- `closed_issue`
- `added_label` **wontfix**
- `new_pullrequest` **foo-bar** **test**
```

Now, whenever any Issue that is assigned, or closed, or a `wontfix` label is added, or a new Pull Request is opened will show up in this Column.


# Rules

The type of rules outlined in there are:

- `new_issue` : When an Issue is created (optionally, a space-separated set of repo names)
- `new_pullrequest` : When a Pull Request is created (optionally, a space-separated set of repo names)
- `assigned_to_issue`: When an Issue is assigned to a specific user
- `assigned_issue`: When an Issue is assigned to a user (but was not before)
- `unassigned_issue`: When an Issue is no longer assigned to a user
- `assigned_pullrequest`: When a Pull Request is assigned to a user (but was not before)
- `unassigned_pullrequest`: When a Pull Request is no longer assigned to a user
- `reopened_issue`: When an Issue is reopened
- `reopened_pullrequest`: When a Pull Request is reopened
- `added_reviewer`: (optional username or array of usernames that need to be added)
- `accepted_pullrequest`: When at least one Reviewer Accepted, and there are no Rejections on a Pull request
- `merged_pullrequest`: When a Pull Request is merged
- `closed_pullrequest`: When a Pull Request is closed
- `added_label`: (has one argument, the string representing the name of the label)
- `removed_label`: (has one argument, the string representing the name of the label)
- `closed_issue`: When an Issue is closed
- `edited_issue`
- `milestoned_issue`
- `demilestoned_issue`
- Not finding the event you would like? Just create a new Issue in this Repository!


# Screencap

![automatic-project-columns](https://user-images.githubusercontent.com/253202/37872089-ad7d21ea-2fcd-11e8-81ba-7f3977c102cf.gif)
