from tqdm import tqdm
from tqdm.utils import _unicode


class TQDMK8S(tqdm):

    @staticmethod
    def status_printer(fp):
        fp_flush = getattr(fp, 'flush', lambda: None)  # pragma: no cover

        def fp_write(s):
            fp.write(_unicode(s))
            fp_flush()

        def print_status(s):
            fp_write(s + "\n")

        return print_status
