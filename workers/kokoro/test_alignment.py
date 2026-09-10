import unittest
from worker import align_words

class AlignmentTests(unittest.TestCase):
    def test_punctuation_and_compounds_preserve_source_words(self):
        words=align_words("It's before-and-after.",[("It",0,.1),("'s",.1,.2),("before",.3,.5),("-",None,None),("and",.5,.6),("-",None,None),("after",.6,.9),(".",None,None)],1)
        self.assertEqual([w['word'] for w in words],["It's","before-and-after."])
        self.assertEqual(words[-1]['endSeconds'],.9)
    def test_missing_word_is_not_fabricated(self):
        with self.assertRaises(ValueError): align_words('one two',[('one',0,.3)],1)
    def test_chunk_offsets_and_waveform_tail(self):
        words=align_words('one two',[('one',.1,.3),('two',1.2,1.5)],1.8)
        self.assertEqual(words[-1]['startSeconds'],1.2)
        self.assertLess(words[-1]['endSeconds'],1.8)

if __name__=='__main__':unittest.main()
