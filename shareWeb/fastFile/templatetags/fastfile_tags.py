from django import template

register = template.Library()


@register.filter
def can_download(file, user):
    return file.can_download(user)
