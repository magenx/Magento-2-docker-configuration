# syntax = docker/dockerfile:labs

ARG CLOUDFLARED_IMAGE
FROM ${CLOUDFLARED_IMAGE}

# Dashboard-managed tunnel: hostnames and Access policies live in Cloudflare Zero Trust, nothing to copy here.
# Built from this repo so the release scans, signs and pins it by digest like the other stack images.
