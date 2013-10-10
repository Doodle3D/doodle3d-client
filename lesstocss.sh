#!/bin/bash

echo 'converting LESS to CSS...'
# generate CSS from LESS
lessc less/styles.less css/styles.css

if [ -a css/styles.min.css ]; then
  rm css/styles.min.css
fi

if [ -n "$1" ]; then
  if [ $1 = '--prefix' ] || [ $1 = '-p' ]; then
    echo 'applying prefixr...'

    # prefixed (-s overwrites existing file)
    prefixr --input ./css/styles.css -s
  fi
  if [ $1 = '--minify' ] || [ $1 = '-m' ]; then

    if [ ! -n "$2" ]; then
      echo 'creating minified....'
      lessc --yui-compress less/styles.less css/styles.min.css
    else
      echo 'creating minified and prefixed...'

      # copy to .min.css to create a minified version as well
      cp css/styles.css css/styles.min.css

      # prefixed and minified (-s overwrites existing file)
      prefixr --input ./css/styles.min.css -s -c
   fi

  fi
fi



if [ -n "$2" ]; then
  if [ $2 = '--prefix' ] || [ $2 = '-p' ]; then
    echo 'applying prefixr...'

    # prefixed (-s overwrites existing file)
    prefixr --input ./css/styles.css -s
  fi
  if [ $2 = '--minify' ] || [ $2 = '-m' ]; then
    echo 'creating minified and prefixed...'

    # copy to .min.css to create a minified version as well
    cp css/styles.css css/styles.min.css

    # prefixed and minified (-s overwrites existing file)
    prefixr --input ./css/styles.min.css -s -c
  fi
fi

