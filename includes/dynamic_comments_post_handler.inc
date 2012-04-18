<?php

/**
 * @file
 * Post handler file for Dynamic Comments.
 */

/**
 * Custom function
 */
function dynamic_comments_post_handler() {

  // Check token and return an access denied if it doesn't validate.
  if (!drupal_valid_token($_POST['token'])) {

    return drupal_access_denied();
  }

  // Validate if nid is numeric as an added security measure.
  if (!is_numeric($_POST['nid'])) {
    return drupal_access_denied();
  }

  // Get action from POST.
  switch (filter_xss($_POST['action'])) {

    case 'insert':
      $data = array(
        'nid'            => $_POST['nid'],
        'comment_body'   => $_POST['comment'],
        'range_position' => $_POST['range'],
        'uid'            => $_POST['user'],
        'parent'         => $_POST['parent'],
        'position'       => $_POST['position'],
        'status'         => $_POST['status'],
      );

      $result = drupal_write_record('dynamic_comments_comments', $data);

      if (!$result) {
        drupal_json(array(
          'severity'  => 'error',
          'message'   => t('Failed to save your comment.'),
        ));
      }
      else {
        drupal_json(array(
          'severity'  => 'status',
          'message'   => t('Your comment has been saved.'),
        ));
      }

      break;

    case 'retrieve':
      $json_return = array();

      $data = array(
          'nid' => filter_xss($_POST['nid']),
      );

      $result = db_query('SELECT c.nid, c.cid, c.comment_body, c.range_position, c.uid, c.parent, c.position, c.status
                          FROM {dynamic_comments_comments} c
                          WHERE c.nid = %d', $data['nid']);

      while ($comment = db_fetch_object($result)) {

        $user = user_load($comment->uid);

        // In case user pic isn't set, we provide a module default one.
        if ($user->picture == '') {
          $user->picture = drupal_get_path('module', 'dynamic_comments') . '/images/silhouette.gif';
        }

        $json_comment = drupal_to_js(array(
          'nid'           => filter_xss($comment->nid),
          'cid'           => filter_xss($comment->cid),
          'comment'       => check_plain($comment->comment_body),
          'range'         => filter_xss($comment->range_position),
          'user'          => filter_xss($comment->uid),
          'parent'        => filter_xss($comment->parent),
          'position'      => filter_xss($comment->position),
          'status'        => filter_xss($comment->status),
          'user_picture'  => filter_xss($user->picture),
          'user_name'     => filter_xss($user->name),
                ));

        $json_return[$comment->cid] = $json_comment;
      }


      return drupal_json($json_return);

      break;

    case 'delete':
      global $user;

      /*
       * Just for kicks, let's check that the user being sent from the JS actually
       * is the current user performing this ;)
       */
      if (filter_xss($_POST['user']) == $user->uid) {

        // Also check if the permission has been granted.
        if (user_access('delete single comments')) {

          $data = array(
            'nid'     => $_POST['nid'],
            'comment' => $_POST['comment'],
            'uid'     => $_POST['user'],
            'parent'  => $_POST['parent'],
          );

          // Cast to int to avoid errors.
          if ((int) $data['parent'] == 0) {

            // First run query on parents then on child comments.
            $query_1 = db_query('DELETE FROM {dynamic_comments_comments} WHERE cid = %d', $data['comment']);
            $query_2 = db_query('DELETE FROM {dynamic_comments_comments} WHERE parent = %d', $data['comment']);

            // Both queries have to come back as true to return a true result.
            if ($query_1 && $query_2) {
              $result = TRUE;
            }
          }

          // Not a parent comment, just erase.
          else {

            $result = db_query('DELETE FROM {dynamic_comments_comments} WHERE cid = %d', $data['comment']);
          }


        }
      }

      if (!$result) {
        drupal_json(array(
          'status'    => 'fail',
          'comment'   => check_plain($data['comment']),
          'severity'  => 'error',
          'message'   => t('Failed to delete your comment.'),
        ));
      }
      else {
        drupal_json(array(
          'status'    => 'ok',
          'comment'   => check_plain($data['comment']),
          'severity'  => 'warning',
          'message'   => t('Your comment has been deleted.'),
        ));
      }

      break;

    case 'update':
      global $user;

      /*
       * Just for kicks, let's check that the user being sent from the JS actually
       * is the current user performing this ;)
       */
      if (filter_xss($_POST['user']) == $user->uid) {

        // Also check if the permission has been granted.
        if (user_access('resolve comments')) {

          $data = array(
            'nid'     => $_POST['nid'],
            'comment' => $_POST['comment'],
            'uid'     => $_POST['user'],
            'parent'  => $_POST['parent'],
            'status'  => $_POST['status'],
          );

          $result = db_query('UPDATE {dynamic_comments_comments} SET status = %d WHERE cid = %d', $data['status'], $data['comment']);

        }
      }

      if (!$result) {
        drupal_json(array(
          'status'    => 'fail',
          'comment'   => check_plain($data['comment']),
          'severity'  => 'error',
          'message'   => t('Failed to resolve your comment.'),
        ));
      }
      else {
        drupal_json(array(
          'status'    => 'ok',
          'comment'   => check_plain($data['comment']),
          'severity'  => 'status',
          'message'   => t('Your comment has been resolved.'),
        ));
      }

      break;
  }
}
