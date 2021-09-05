======================
Mapping Recorded Music
======================

Howdy
=====

Who I am
--------

- Make my coin as a software engineer
- My background is in the arts and music industry
- Currently in Kingston, NY

.. nextslide::

.. rst-class:: build

- Oberlin: BMus in composition
- Forced Exposure: music distribution
- Harvard: masters / PhD in composition
- Music21 @ MIT: toolkit for digital musicology
- Discogs: music database / marketplace
- CapitalOne: banking core modernization

A cute dog
----------

.. figure:: images/bradley.jpg
   :class: fill

Musical maps
============

State of play
-------------

.. rst-class:: build

- A variety of musical maps exist today
- Some are interactive, some aren't
- Most are concerned with concepts of "genre", "style", "period" and how these
  categories mutate into other categories, and generate new categories
- *But*, they almost all represent music history as a graph

.. nextslide::

.. figure:: images/map-of-metal.png
   :class: fill

.. nextslide::

.. figure:: images/map-of-acid.jpg
   :class: fill

.. nextslide::

.. figure:: images/map-of-ishkur.png
   :class: fill

Lossy abstractions
------------------

- Abstract categorizations are highly subjective
- They elide really interesting information
- Who collaborated with who?
- Who curated or published who, and when?
- How do multiple labels' curation overlap to create the "moire" effect that we
  want to recognize as style?

Materialist view of history
---------------------------

- Style, and genre don't exist
- But humans and the artifacts of their production do
- Specific artists, companies, releases and songs
- Specific years, countries and formats
- What if we could map these concrete interactions?

We have the data
----------------

- https://discogs.com Discographic Dataset
- http://data.discogs.com/
- Monthly XML dumps
- CC-0 licensed
- 1.7 million companies
- 7.7 million artists
- 14.3 million releases
- 1.9 million "masters"

.. nextslide::

::

    <artist>
      <images>...</images>
      <id>8</id>
      <name>Mood II Swing</name>
      <realname>John Ciafone &amp; Lem Springsteen</realname>
      <profile>...</profile>
      <namevariations><name>...</name></namevariations>
      <aliases>
        <name id="26498">Chronic Sounds</name>
        <name id="34749">Urbanized</name>
        ...
      </aliases>
      <members>
        <id>12186</id>
        <name id="12186">John Ciafone</name>
        <id>27959</id>
        <name id="27959">Lem Springsteen</name>
      </members>
    </artist>

.. nextslide::

.. graphviz::
   :align: center

    digraph G {
        a1 [label="Mood II Swing"]
        a2 [label="Chronic Sounds"]
        a3 [label="Urbanized"]
        a4 [label="John Ciafone"]
        a5 [label="Lem Springsteen"]
        a1 -> a2 [dir=both,label="alias"]
        a1 -> a3 [dir=both,label="alias"]
        a4 -> a1 [label="member"]
        a5 -> a1 [label="member"]
    }

Prior work
==========

Disco/graph (2015)
------------------

- Flask, d3, PostgreSQL
- Graph database implemented by hand
- Visualizes connections between entities
- But loses information about "where" connections occurred

.. nextslide::

.. raw:: html

    <br/>
    <div style="padding:62.5% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/138564453?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;h=8d2543f5db" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;" title="discoGraph demo #2: From Morris Day to Björk"></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>


https://on-exactitude-in.science
================================

Fast forward to 2020
--------------------

- Happy quarantine!
- Time to revisit the 2015 project
- Let's use a modern stack
- Let's use a proper graph database
- Let's do it in 3D
- Let's provide maximum granularity

On Exactitude In Science
------------------------

Jorge Luis Borges:

    ... In that Empire, the Art of Cartography attained such Perfection that the
    map of a single Province occupied the entirety of a City, and the map of the
    Empire, the entirety of a Province.
    
    In time, those Unconscionable Maps no longer satisfied, and the
    Cartographers Guilds struck a Map of the Empire whose size was that of the
    Empire, and which coincided point for point with it.
    
    The following Generations, who were not so fond of the Study of Cartography
    as their Forebears had been, saw that that vast Map was Useless, and not
    without some Pitilessness was it, that they delivered it up to the
    Inclemencies of Sun and Winters.
    
    In the Deserts of the West, still today, there are Tattered Ruins of that
    Map, inhabited by Animals and Beggars; in all the Land there is no other
    Relic of the Disciplines of Geography.

Demo
----

Stack
-----

- Kubernetes
- JanusGraph, Scylla, Elasticsearch
- aiohttp, aiogremlin
- React, Redux, Material UI
- d3, three.js

Aside: graph databases
----------------------

Gremlin
-------

https://tinkerpop.apache.org/gremlin.html

    Gremlin is the graph traversal language of Apache TinkerPop. Gremlin is a
    functional, data-flow language that enables users to succinctly express complex
    traversals on (or queries of) their application's property graph.
    
    Every Gremlin traversal is composed of a sequence of (potentially nested)
    steps.  A step performs an atomic operation on the data stream.
    
    Every step is either a map-step (transforming the objects in the stream), a
    filter-step (removing objects from the stream), or a sideEffect-step
    (computing statistics about the stream).
    
    The Gremlin step library extends on these 3-fundamental operations to
    provide users a rich collection of steps that they can compose in order to
    ask any conceivable question they may have of their data for Gremlin is
    Turing Complete.

.. nextslide::

What are the names of Josiah's friends' friends.

::

    g.V().has("name", "Josiah")
        .out("knows")
        .out("knows")
        .values("name")

ETL
---

- Vertices, then edges

.. nextslide::

- Add artist, company, master vertices
- Add artist, company, edges
- Add releases & tracks vertices and edges

.. nextslide::

- Multiple passes allow for lookups of previously created vertices
- Assumes that data can be loaded with each new monthly dump, rather than just
  once
- Maybe not a good assumption though

Querying
--------

- neighborhood pseudocode

Querying: Iteration 0
---------------------

.. graphviz::
   :align: center
   :layout: neato

    digraph G {
        a
    }

Querying: Iteration 1
---------------------

.. graphviz::
   :align: center
   :layout: neato

    digraph G {
        graph [overlap=prism];
        a -> b
        a -> c
        a -> d
        a -> e
    }

Querying: Iteration 2
---------------------

.. graphviz::
   :align: center
   :layout: neato

    digraph G {
        graph [overlap=prism];
        a -> b
        a -> c
        a -> d
        a -> e
        b -> f
        c -> g
        c -> h
        d -> i
        d -> j
        d -> k
        d -> l
    }

Querying: Iteration 3
---------------------

.. graphviz::
   :align: center
   :layout: neato

    digraph G {
        graph [overlap=prism];
        a -> b
        a -> c
        a -> d
        a -> e
        b -> f
        c -> g
        c -> h
        d -> i
        d -> j
        d -> k
        d -> l
        f -> h
        f -> i
        g -> i
        h -> m
        h -> n
        h -> o
        i -> m
        i -> p
        i -> q
        i -> r
        i -> s
        i -> t
        j -> m
        j -> u
        j -> v
        k -> w
        l -> x
        l -> y
        l -> z
    }

Visualizing
-----------

- Api returns edges and vertices
- Conversion to force directed graph
- Each edge gets its own "control point" vertex

Performance
===========

Physics engine
--------------

- Force directed graphs model an n-body problem
- Barnes-Hutte approximation
- Octree vs garbage collection
- GPU-acceleration
- Brute force O(n^2)

Query optimization
------------------

Schema
------

::

    class Artist(Vertex): 
        artist_id: int
        last_modified: datetime
        name: str
        random: float

::

    class Company(Vertex):
        company_id: int
        last_modified: datetime
        name: str
        random: float

::

    class Master(Vertex):
        master_id: int
        last_modified: datetime
        name: str
        random: float

.. nextslide::

::

    class Release(Vertex):
        country: str
        formats: Set[str]
        genres: Set[str]
        last_modified: datetime
        name: str
        primacy: int
        random: float
        release_id: int
        styles: Set[str]
        videos: str
        year: int

::

    class Track(Vertex):
        track_id: int
        ...

.. nextslide::

::

    class Relationship(Edge):
        last_modified: datetime
        name: str
        primacy: int


