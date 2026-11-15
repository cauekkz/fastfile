from django.core.paginator import Paginator
from .models import *
def nav_page(number,posts):
    pages = Paginator(posts,12)
    try:
        number = int(number) if number is not None else 1
    except ValueError:
        return None, None

    if number > pages.num_pages or number < 1:
        return None, None

    page = pages.page(number)
    start = max(1, number - 2)
    end = min(pages.num_pages, start + 4)
    start = max(1, end - 4)
    pageLinks = list(range(start, end + 1)) if pages.num_pages > 1 else []
    return page, pageLinks

def check_inputs(type,input):
    match type:
        case 'password':
            if len(input) < 8:
                return False
        case 'username':
            if User.objects.filter(username=input).exists():
                return False
        case 'email':
            if User.objects.filter(email=input).exists():
                return False
        case _:
            return False
        
    return True