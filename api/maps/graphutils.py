from aiogremlin.process.graph_traversal import __
from gremlin_python.process.traversal import Cardinality, P


def cleanup_edge(result):
    result["id"] = result["id"]["@value"]["relationId"]
    result.update(result.pop("values", {}))
    if "role" not in result:
        result["role"] = result["label"].replace("_", " ").title()
    return result


def cleanup_values(label, values, goblin_app):
    vertex = goblin_app.vertices[label]
    for key, value in values.items():
        prop = vertex.__properties__[key]
        if (
            value
            and getattr(prop, "cardinality", Cardinality.single) == Cardinality.single
        ):
            values[key] = value[0]


def cleanup_vertex(result, goblin_app):
    cleanup_values(result["label"], result["values"], goblin_app)
    result["eid"] = result["values"].pop(result["label"] + "_id")
    result.update(result.pop("values"))
    if extra := result.pop("extra"):
        cleanup_values("release", extra, goblin_app)
        for key, value in extra.items():
            if key in result or key.endswith("_id"):
                continue
            result[key] = value
    if "is_main_release" in result:
        result["main"] = result.pop("is_main_release")
    return result


def project_edge(traversal):
    return (
        traversal.project("source", "edge", "target")
        .by(project_vertex(__.outV()))
        .by(
            __.project("id", "label", "values")
            .by(__.id())
            .by(__.label())
            .by(__.valueMap())
        )
        .by(project_vertex(__.inV()))
    )


def project_vertex(traversal):
    return (
        traversal.project(
            "id", "label", "values", "total_edge_count", "child_count", "extra"
        )
        .by(__.id())
        .by(__.label())
        .by(__.valueMap())
        .by(__.bothE().count())
        .by(__.inE("member_of", "subsidiary_of", "subrelease_of").count())
        .by(
            __.choose(
                __.inE("includes").count().is_(P.gt(0)),
                # __.hasLabel("track"),
                __.in_("includes").valueMap(),
                __.constant(False),
            )
        )
    )