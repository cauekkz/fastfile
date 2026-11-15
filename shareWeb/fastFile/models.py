from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    pass
    

class File(models.Model):
    name = models.CharField(max_length=100)
    postedBy = models.ForeignKey(User, related_name='posteds', on_delete=models.CASCADE)
    file = models.FileField(upload_to='uploads/')
    postedAt = models.DateTimeField(auto_now_add=True)
    password = models.CharField(max_length=100)
    userPermition = models.BooleanField(default=False)
    allowedUsers = models.ManyToManyField(User, related_name='allowedFiles')
    downloadsCount = models.IntegerField(default=0)

    @property
    def has_password(self):
        return bool(self.password)

    @property
    def is_restricted(self):
        return self.has_password or self.userPermition

    @property
    def extension(self):
        name = self.file.name or ''
        return name.rsplit('.', 1)[-1].lower() if '.' in name else 'file'

    @property
    def kind(self):
        ext = self.extension
        groups = {
            'image': {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'},
            'video': {'mp4', 'mkv', 'mov', 'avi', 'webm'},
            'audio': {'mp3', 'wav', 'flac', 'ogg', 'm4a'},
            'archive': {'zip', 'rar', '7z', 'tar', 'gz'},
            'code': {'py', 'js', 'ts', 'html', 'css', 'json', 'c', 'cpp', 'java', 'go', 'rs', 'sh'},
            'doc': {'pdf', 'doc', 'docx', 'txt', 'md', 'odt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'},
        }
        for kind, exts in groups.items():
            if ext in exts:
                return kind
        return 'other'

    @property
    def size_display(self):
        try:
            size = self.file.size
        except (FileNotFoundError, ValueError, OSError):
            return '—'
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f'{size:.0f} {unit}' if unit == 'B' else f'{size:.1f} {unit}'
            size /= 1024
        return f'{size:.1f} TB'

    def can_download(self, user):
        if not self.is_restricted:
            return True
        return user.is_authenticated and self.allowedUsers.filter(pk=user.pk).exists()

    def __str__(self):
        return self.name

class MessageCommonInfos(models.Model):
    message = models.CharField(max_length=200)
    sendAt = models.DateTimeField(auto_now_add=True)
    seen = models.BooleanField(default=False)
    class Meta:
        abstract = True
    
class Message(MessageCommonInfos):
    caller = models.ForeignKey(User, related_name='sends', on_delete=models.CASCADE, null=True)
    reciver = models.ForeignKey(User,related_name='messages',on_delete=models.CASCADE)

class RequestMessage(MessageCommonInfos):
    caller = models.ForeignKey(User, related_name='requestsSends', on_delete=models.CASCADE, null=True)
    reciver = models.ForeignKey(User,related_name='requestsMessages',on_delete=models.CASCADE)
    file  = models.ForeignKey(File, on_delete=models.CASCADE)
    
        