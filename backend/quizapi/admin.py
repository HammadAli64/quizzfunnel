from django.contrib import admin

from .models import QuizOption, QuizQuestion, Result, User


class ResultInline(admin.StackedInline):
    model = Result
    extra = 0
    can_delete = False
    fields = ("score", "category", "virus", "course_offer", "ai_report", "created_at")
    readonly_fields = ("score", "category", "virus", "course_offer", "ai_report", "created_at")


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "score", "category", "virus", "course_offer", "created_at")
    search_fields = ("name", "email", "phone")
    ordering = ("-created_at",)
    inlines = [ResultInline]

    @admin.display(description="Score")
    def score(self, obj):
        return obj.result.score if hasattr(obj, "result") else "-"

    @admin.display(description="Category")
    def category(self, obj):
        return obj.result.category if hasattr(obj, "result") else "-"

    @admin.display(description="Virus")
    def virus(self, obj):
        return obj.result.virus if hasattr(obj, "result") else "-"

    @admin.display(description="Course Offer")
    def course_offer(self, obj):
        return obj.result.course_offer if hasattr(obj, "result") else "-"


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "score", "category", "virus", "course_offer", "created_at")
    search_fields = ("user__name", "user__email", "category")
    ordering = ("-created_at",)


class QuizOptionInline(admin.TabularInline):
    model = QuizOption
    extra = 0


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "section", "question_text", "created_at")
    search_fields = ("question_text", "section")
    ordering = ("id",)
    inlines = [QuizOptionInline]
