import asyncio

def win_selector_loop_factory(use_subprocess: bool = False):
    return asyncio.SelectorEventLoop()
