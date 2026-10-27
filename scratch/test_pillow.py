try:
    import PIL
    print('Pillow is installed:', PIL.__version__)
except Exception as e:
    print('Pillow error:', e)
