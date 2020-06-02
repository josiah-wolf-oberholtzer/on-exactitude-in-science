.PHONY: build docs gh-pages

project = maps
errors = E123,E203,E265,E266,E501,W503
origin := $(shell git config --get remote.origin.url)
formatPaths = ${project}/ tests/
testPaths = ${project}/ tests/

black-check:
	black --target-version py36 --check --diff ${formatPaths}

black-reformat:
	black --target-version py36 ${formatPaths}

clean:
	find . -name '*.pyc' | xargs rm
	rm -Rif *.egg-info/
	rm -Rif .*cache/
	rm -Rif .tox/
	rm -Rif __pycache__
	rm -Rif build/
	rm -Rif dist/
	rm -Rif htmlcov/
	rm -Rif prof/

flake8:
	flake8 --max-line-length=90 --isolated --ignore=${errors} ${formatPaths}

isort:
	isort \
		--case-sensitive \
		--multi-line 3 \
		--recursive \
		--trailing-comma \
		--use-parentheses \
		-y \
		${formatPaths}

mypy:
	mypy --ignore-missing-imports ${project}/

pytest:
	rm -Rf htmlcov/
	pytest \
		--cov-config=.coveragerc \
		--cov-report=html \
		--cov-report=term \
		--cov=${project}/ \
		--durations=20 \
		-vv \
		${testPaths}

reformat: isort black-reformat

test: black-check flake8 mypy pytest
