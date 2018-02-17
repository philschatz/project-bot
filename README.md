# probot-projects

Do you like the idea of [GitHub's Project Automation feature](https://github.com/blog/2458-keep-your-project-boards-up-to-date-automatically)
but find it lacking?

This probot will automatically add new Issues or Pull Requests to a Project board.


```yaml
# Example /.github/config.yml file for a repository
project:
  type: "REPOSITORY" # or "ORGANIZATION"
  number: 1
  new_issue_column:
    index: 0
    # name: "To do"
  new_pull_request_column:
    index: 1
    # name: "In progress"
```

When combined with [GitHub's Project Automation feature](https://github.com/blog/2458-keep-your-project-boards-up-to-date-automatically)
you can just look at your Project Board and no longer need to look through individual repositories to see the state of your project.
