from django.contrib.auth.hashers import make_password
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from fastFile.models import File, Message, RequestMessage, User

PASSWORD = 'fastfile123'

USERS = ['ana_dev', 'bruno_music', 'carla_design', 'diego_gamer']

# (owner, name, file name, size in KB, file password, requires approval, downloads)
FILES = [
    ('ana_dev', 'Django Cheatsheet', 'django-cheatsheet.pdf', 220, '', False, 3),
    ('ana_dev', 'Portfolio Website Source', 'portfolio-site.zip', 1800, '', True, 0),
    ('ana_dev', 'Python Automation Scripts', 'automate.py', 14, '', False, 2),
    ('ana_dev', 'Meeting Notes Q4', 'notes-q4.md', 6, '', False, 0),
    ('bruno_music', 'Lo-fi Study Mix', 'lofi-study-mix.mp3', 3200, '', False, 5),
    ('bruno_music', 'Beat Pack Vol 3', 'beat-pack-vol3.zip', 2600, 'beats', False, 2),
    ('bruno_music', 'Live Session Recording', 'live-session.mp4', 4100, '', True, 0),
    ('carla_design', 'Mountain Sunset Wallpaper', 'sunset-4k.png', 900, '', False, 4),
    ('carla_design', 'Design System Kit', 'design-system-kit.zip', 2100, 'kit2026', True, 0),
    ('carla_design', 'Brand Guidelines 2026', 'brand-guidelines.pdf', 760, '', False, 2),
    ('carla_design', 'Pastel Icon Set', 'pastel-icons.svg', 48, '', False, 1),
    ('diego_gamer', 'Speedrun Saves', 'speedrun-saves.zip', 380, 'gg', False, 1),
    ('diego_gamer', 'Gameplay Highlights', 'highlights.mp4', 3900, '', False, 4),
    ('diego_gamer', 'Mod Config', 'mod-config.json', 3, '', False, 1),
    ('diego_gamer', 'Tournament Bracket', 'bracket.xlsx', 35, '', True, 0),
]

# (requester, file)
REQUESTS = [
    ('diego_gamer', 'Portfolio Website Source'),
    ('carla_design', 'Tournament Bracket'),
    ('bruno_music', 'Design System Kit'),
    ('ana_dev', 'Live Session Recording'),
]


class Command(BaseCommand):
    help = 'Fills the database with demo users, files and access requests.'

    def handle(self, *args, **options):
        users = {}
        for name in USERS:
            user, created = User.objects.get_or_create(username=name, defaults={'email': f'{name.split("_")[0]}@fastfile.test'})
            if created:
                user.set_password(PASSWORD)
                user.save()
            users[name] = user

        for owner, name, filename, kb, pw, approval, downloads in FILES:
            if File.objects.filter(name=name).exists():
                continue
            content = ContentFile(b'fastFile demo content\n' + b'x' * kb * 1024, name=filename)
            f = File.objects.create(
                name=name, postedBy=users[owner], file=content,
                password=make_password(pw) if pw else '',
                userPermition=approval, downloadsCount=downloads,
            )
            f.allowedUsers.add(users[owner])

        for caller, filename in REQUESTS:
            f = File.objects.get(name=filename)
            RequestMessage.objects.get_or_create(
                caller=users[caller], reciver=f.postedBy, file=f,
                defaults={'message': f'Can {caller}  download your "{f.name}" file?'},
            )

        beat = File.objects.get(name='Beat Pack Vol 3')
        if not beat.allowedUsers.filter(pk=users['diego_gamer'].pk).exists():
            beat.allowedUsers.add(users['diego_gamer'])
            Message.objects.create(caller=users['diego_gamer'], reciver=beat.postedBy,
                                   message=f'diego_gamer can download your {beat.name} file')

        self.stdout.write(self.style.SUCCESS(
            f'Done! {len(USERS)} users and {len(FILES)} files. Password for every account: {PASSWORD}'))
