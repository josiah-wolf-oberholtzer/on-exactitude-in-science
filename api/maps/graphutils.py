from aiogremlin.process.graph_traversal import __
from gremlin_python.process.traversal import Cardinality, P

roles_to_labels = {
    "Alias Of": "alias_of",
    "Includes": "includes",
    "Member Of": "member_of",
    "Released": "released",
    "Released On": "released_on",
    "Subsidiary Of": "subsidiary_of",
    "Subrelease Of": "subrelease_of",
}


labels_to_roles = {
    "alias_of": "Alias Of",
    "includes": "Includes",
    "member_of": "Member Of",
    "released": "Released",
    "released_on": "Released On",
    "subsidiary_of": "Subsidiary Of",
    "subrelease_of": "Subrelease Of",
}


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
    if (
        in_roles := sorted(
            list(result.pop("in_roles", {}))
            + [
                labels_to_roles[label]
                for label in result.pop("in_labels", [])
                if label != "credited_with"
            ]
        )
    ) :
        result["in_roles"] = in_roles
    if (
        out_roles := sorted(
            list(result.pop("out_roles", {}))
            + [
                labels_to_roles[label]
                for label in result.pop("out_labels", [])
                if label != "credited_with"
            ]
        )
    ) :
        result["out_roles"] = out_roles
    return result


def project_vertex(traversal):
    return (
        traversal.project(
            "id",
            "label",
            "values",
            "total_edge_count",
            "child_count",
            "extra",
            "in_labels",
            "in_roles",
            "out_labels",
            "out_roles",
        )
        .by(__.id())
        .by(__.label())
        .by(__.valueMap())
        .by(__.bothE().count())
        .by(__.inE("member_of", "subsidiary_of", "subrelease_of").count())
        .by(
            __.choose(
                __.inE("includes").count().is_(P.gt(0)),
                __.in_("includes").valueMap(),
                __.constant(False),
            )
        )
        .by(__.inE().groupCount().by(__.label()))
        .by(__.inE("credited_with").groupCount().by("role"))
        .by(__.outE().groupCount().by(__.label()))
        .by(__.outE("credited_with").groupCount().by("role"))
    )
