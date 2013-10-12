#!/bin/bash

choices=0

if [ ! -n "$1" ]; then
  echo 'no arguments passed.. this will simply convert LESS to CSS.'
  echo "in case you're wondering, there's arguments you can pass:"
  echo ' -m / --minify  =  minify css'
  echo ' -p / --prefix  =  apply browser-specific prefixes'
  echo ''
fi


if [ -n "$1" ]; then
  if [ $1 = '--prefix' ] || [ $1 = '-p' ]; then
    # echo 'got prefix'
    choices=`expr $choices + 1`
  fi
  if [ $1 = '--minify' ] || [ $1 = '-m' ]; then
    # echo 'got minify'
    choices=`expr $choices + 2`
  fi
fi
if [ -n "$2" ]; then
  if [ $2 = '--prefix' ] || [ $2 = '-p' ]; then
    # echo 'got prefix'
    choices=`expr $choices + 1`
  fi
  if [ $2 = '--minify' ] || [ $2 = '-m' ]; then
    # echo 'got minify'
    choices=`expr $choices + 2`
  fi
fi


if [ -a css/styles.min.css ]; then
  rm css/styles.min.css
fi

# generate CSS from LESS
echo 'converting LESS to CSS...'
lessc less/styles.less css/styles.css

case "$choices" in
"0")
    echo 'just less-to-css'
    ;;
"1")
    echo 'applying prefixr...'
    # prefixed (-s overwrites existing file)
    prefixr --input ./css/styles.css -s
    ;;
"2")
    echo 'creating minified....'
    lessc --yui-compress less/styles.less css/styles.min.css
    ;;
"3")
    echo 'creating minified and prefixed...'

    # prefixed (-s overwrites existing file)
    prefixr --input ./css/styles.css -s

    # copy to .min.css to create a minified version as well
    cp css/styles.css css/styles.min.css

    # prefixed and minified (-s overwrites existing file)
    prefixr --input ./css/styles.min.css -s -c
    ;;
*)
    echo 'catch-all'
    ;;
esac