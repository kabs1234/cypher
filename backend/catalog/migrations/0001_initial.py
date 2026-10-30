import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Artist',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=200, unique=True)),
                ('city_region', models.CharField(blank=True, max_length=200)),
                ('active_since', models.PositiveSmallIntegerField()),
                ('bio', models.TextField(blank=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Term',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=200, unique=True)),
                ('type', models.CharField(choices=[('slang', 'Slang'), ('person', 'Person'), ('place', 'Place'), ('event', 'Event'), ('brand', 'Brand'), ('religion', 'Religion'), ('other', 'Other')], max_length=10)),
                ('explanation', models.TextField()),
                ('explanation_ru', models.TextField(blank=True)),
                ('sources', models.TextField()),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('verified', 'Verified')], default='draft', max_length=10)),
                ('notes', models.TextField(blank=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Album',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=200)),
                ('release_year', models.PositiveSmallIntegerField()),
                ('overview', models.TextField(blank=True)),
                ('overview_status', models.CharField(choices=[('draft', 'Draft'), ('verified', 'Verified')], default='draft', max_length=10)),
                ('artist', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='albums', to='catalog.artist')),
            ],
            options={
                'ordering': ['artist__name', 'release_year'],
            },
        ),
        migrations.CreateModel(
            name='Track',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(max_length=200)),
                ('track_number', models.PositiveSmallIntegerField()),
                ('duration_seconds', models.PositiveIntegerField()),
                ('album', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tracks', to='catalog.album')),
            ],
            options={
                'ordering': ['album', 'track_number'],
            },
        ),
        migrations.CreateModel(
            name='TrackReference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('timestamp_seconds', models.PositiveIntegerField()),
                ('context_note', models.CharField(max_length=300)),
                ('term', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='references', to='catalog.term')),
                ('track', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='references', to='catalog.track')),
            ],
            options={
                'ordering': ['track', 'timestamp_seconds'],
            },
        ),
        migrations.AddConstraint(
            model_name='album',
            constraint=models.UniqueConstraint(fields=('artist', 'title'), name='unique_album_title_per_artist'),
        ),
        migrations.AddConstraint(
            model_name='track',
            constraint=models.UniqueConstraint(fields=('album', 'track_number'), name='unique_track_number_per_album'),
        ),
        migrations.AddConstraint(
            model_name='trackreference',
            constraint=models.UniqueConstraint(fields=('track', 'term', 'timestamp_seconds'), name='unique_reference_per_track_term_timestamp'),
        ),
    ]
