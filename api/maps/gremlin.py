from gremlin_python import statics
from gremlin_python.process.traversal import TextP


class JGTextP(TextP):
    @classmethod
    def textContains(cls, *args):
        return cls("textContains", *args)

    @classmethod
    def textContainsPrefix(cls, *args):
        return cls("textContainsPrefix", *args)

    @classmethod
    def textContainsRegex(cls, *args):
        return cls("textContainsRegex", *args)

    @classmethod
    def textContainsFuzzy(cls, *args):
        return cls("textContainsFuzzy", *args)

    @classmethod
    def textPrefix(cls, *args):
        return cls("textPrefix", *args)

    @classmethod
    def textRegex(cls, *args):
        return cls("textRegex", *args)

    @classmethod
    def textFuzzy(cls, *args):
        return cls("textFuzzy", *args)


def textContains(*args):
    return JGTextP.textContains(*args)


def textContainsPrefix(*args):
    return JGTextP.textContainsPrefix(*args)


def textContainsRegex(*args):
    return JGTextP.textContainsRegex(*args)


def textContainsFuzzy(*args):
    return JGTextP.textContainsFuzzy(*args)


def textPrefix(*args):
    return JGTextP.textPrefix(*args)


def textRegex(*args):
    return JGTextP.textRegex(*args)


def textFuzzy(*args):
    return JGTextP.textFuzzy(*args)


statics.add_static("textContains", textContains)
statics.add_static("textContainsPrefix", textContainsPrefix)
statics.add_static("textContainsRegex", textContainsRegex)
statics.add_static("textContainsFuzzy", textContainsFuzzy)
statics.add_static("textPrefix", textPrefix)
statics.add_static("textRegex", textRegex)
statics.add_static("textFuzzy", textFuzzy)
